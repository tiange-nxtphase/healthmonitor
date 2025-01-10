# Base image with Nginx
FROM nginx:alpine

# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (default Nginx port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
