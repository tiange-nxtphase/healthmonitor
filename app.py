import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.storage.blob import BlobClient
from orq_ai_sdk import OrqAI

app = Flask(__name__)
CORS(app)

READINGS_BLOB_SAS_URL = "https://healthmonitorstatic.blob.core.windows.net/data/readings.json?sp=racwd&st=2025-01-10T02:03:08Z&se=2025-05-10T09:03:08Z&sv=2022-11-02&sr=b&sig=S%2BDa06Fr7EiacM1MFWj5RlzHYqFTMbiR%2FTg0TZ3Eknw%3D"
CONVERSATIONS_BLOB_SAS_URL = "https://healthmonitorstatic.blob.core.windows.net/data/conversations.json?sp=racwdy&st=2025-01-10T02:01:34Z&se=2025-05-10T09:01:34Z&sv=2022-11-02&sr=b&sig=QOMG8gRV0rqvzkHFOVYBrP5Iu%2BOCXRQZMRkp98ZvwAk%3D"

def read_blob(blob_sas_url):
    blob_client = BlobClient.from_blob_url(blob_sas_url)
    if blob_client.exists():
        blob_data = blob_client.download_blob().readall()
        return json.loads(blob_data)
    return {} if "readings" in blob_sas_url else []

def write_blob(blob_sas_url, data):
    blob_client = BlobClient.from_blob_url(blob_sas_url)
    blob_client.upload_blob(json.dumps(data), overwrite=True)

def read_data():
    return read_blob(READINGS_BLOB_SAS_URL)

def read_conversations():
    return read_blob(CONVERSATIONS_BLOB_SAS_URL)

def save_conversations(conversations):
    write_blob(CONVERSATIONS_BLOB_SAS_URL, conversations)

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
            'ALT_liver_enzymes': new_reading['ALT_liver_enzymes'],
            'triglyceride_hdl_ratio': new_reading['triglyceride_hdl_ratio']
        }

        data = read_data()
        if date in data:
            data[date].update(reading_values)
        else:
            data[date] = reading_values

        write_blob(READINGS_BLOB_SAS_URL, data)
        
        # Removed the socket emission part
        return jsonify({'status': 'success', 'message': 'Reading added successfully'}), 200
    
    except Exception as e:
         print(e)
         return str(e), 500

@app.route('/api/clearAllReadings', methods=['DELETE'])
def clear_all_readings():
    try:
        write_blob(READINGS_BLOB_SAS_URL, {})
        write_blob(CONVERSATIONS_BLOB_SAS_URL, [])
        return jsonify({'status': 'success', 'message': 'All readings cleared'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/clearchat', methods=['POST'])
def clear_chat():
    try:
        write_blob(CONVERSATIONS_BLOB_SAS_URL, [])
        return jsonify({'message': 'Chat history cleared successfully'}), 200
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
