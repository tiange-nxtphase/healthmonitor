import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import requests
from orq_ai_sdk import OrqAI
import uuid
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

JSON_FILE = 'readings.json'

def read_data():
    try:
        with open(JSON_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}

config_cache = None

def load_config():
    global config_cache
    if not config_cache:
        with open("config.json", 'r') as file:
            config_cache = json.load(file)
    return config_cache

config = load_config()["orq"]
client = OrqAI(api_key=config["api_key"])

@app.route('/api/readings', methods=['GET'])
def get_readings():
    data = read_data()
    return jsonify(data)

@app.route('/api/addReading', methods=['POST'])
def add_reading():
    try:
        new_reading = request.get_json()
        date = new_reading['date']
        
        reading_values = {
            'hsCRP': new_reading['hsCRP'],
            'hba1c': new_reading['hba1c'],
            'fasting_glucose': new_reading['fasting_glucose'],
            'ldl_cholesterol': new_reading['ldl_cholesterol'],
            'triglycerides': new_reading['triglycerides'],
            'hdl_cholesterol': new_reading['hdl_cholesterol'],
            'ALT_liver_enzymes': new_reading['ALT_liver_enzymes']
        }

        try:
            with open(JSON_FILE, 'r') as file:
                data = json.load(file)
        except FileNotFoundError:
            data = {}

        if date in data:
            data[date].update(reading_values)
        else:
            data[date] = reading_values

        with open(JSON_FILE, 'w') as file:
            json.dump(data, file)

        socketio.emit('new_reading', data)

        return jsonify({'status': 'success', 'message': 'Reading added successfully'})
    
    except Exception as e:
         print(e)
         return str(e), 500

@app.route('/api/clearAllReadings', methods=['DELETE'])
def clear_all_readings():
    try:
        with open(JSON_FILE, 'w') as file:
            json.dump({}, file)
        with open('conversations.json', 'w') as file:
            json.dump([], file)  # Write an empty list to clear the conversations
        return jsonify({'status': 'success', 'message': 'All readings cleared'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/clearchat', methods=['POST'])
def clear_chat():
    try:
        with open('conversations.json', 'w') as file:
            json.dump([], file)  # Write an empty list to clear the conversations
        return jsonify({'message': 'Chat history cleared successfully'}), 200
    except FileNotFoundError:
        return jsonify({'error': 'Conversations file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate_insights', methods=['POST'])
def generate_insights():
    try:
        data_object = read_data()
        data = json.dumps(data_object, indent=4) 
        if data: 
            generation = client.deployments.invoke(
                key=config["deployment"],
                inputs={"blood_record": data},
                extra_params={"response_format": {"type": "json_object"}}
            )
            response_text = generation.choices[0].message.content
            print(response_text)
            return jsonify({"response_text": response_text}), 200
        else:
            return jsonify({"response_text": "No data found."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def read_conversations():
    try:
        with open('conversations.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def save_conversations(conversations):
    with open('conversations.json', 'w') as file:
        json.dump(conversations, file)

@app.route('/api/fetchhistory', methods=['GET'])
def get_conversations():
    try:
        conversations = read_conversations()
        return jsonify({
            'conversations': conversations})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initial_chat', methods=['POST'])
def initial_chat():
    try:
        data_object = read_data()
        print('>>>>>>>>passed>>>>>>>>>')
        data = json.dumps(data_object, indent=4) 
        
        if data: 
            print(data)
            ai_input = {
                "blood_record": data,
                "message": "Hello!"
            }
            print('!!!!!!!!!!passed!!!!!!!!!!')

            conversations = read_conversations()

            print(f"Conversations: {conversations}")

            generation = client.deployments.invoke(
                key="healthmonitorchat",
                inputs=ai_input,
                prefix_messages=conversations
            )

            ai_response = generation.choices[0].message.content
            print(f"AI Response: {ai_response}")

            conversations.append({"role": "assistant", "content": ai_response})

            save_conversations(conversations)

            response = {
                "message": ai_response,
                "conversations": conversations  # Return the entire conversation history
            }

            return jsonify(response), 200
        else:
            return jsonify({"error": "No latest HbA1c value available"}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    message = request.json.get('message')
    try:
        data_object = read_data()
        data = json.dumps(data_object, indent=4) 
        if data:
            ai_input = {
                "blood_record": data,
                "user_message": message
            }

            conversations = read_conversations()

            conversations.append({"role": "user", "content": message})

            generation = client.deployments.invoke(
                key="healthmonitorchat",
                inputs=ai_input,
                prefix_messages=conversations
            )

            ai_response = generation.choices[0].message.content
            conversations.append({"role": "assistant", "content": ai_response})

            save_conversations(conversations)

            response = {
                "message": ai_response,
                "conversations": conversations  # Return the entire conversation history
            }

            return jsonify(response), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)