import http.server
import socketserver
import os
from urllib.parse import unquote
import logging
import re

# Configure logging
LOG_FILE = 'upload_server.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

UPLOAD_FOLDER = 'incoming'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    logging.info(f"Created directory: {UPLOAD_FOLDER}")
else:
    logging.info(f"Directory already exists: {UPLOAD_FOLDER}")

class FileUploadHandler(http.server.SimpleHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == '/save':
            content_type = self.headers.get('Content-Type')
            if content_type and content_type.startswith('multipart/form-data'):
                try:
                    boundary = content_type.split('boundary=')[1].encode()
                    content_length = int(self.headers.get('Content-Length', 0))
                    post_data = self.rfile.read(content_length)

                    file_regex = re.compile(rb'Content-Disposition: form-data; name="file"; filename="(?P<filename>[^"]*)"\r\nContent-Type: (?P<content_type>[^\r\n]*)\r\n\r\n(?P<file_data>.*?)\r\n--%s--' % boundary, re.DOTALL)
                    match = file_regex.search(post_data)

                    if match:
                        filename_bytes = match.group('filename')
                        filename = unquote(filename_bytes.decode())
                        file_data = match.group('file_data')
                        filepath = os.path.join(UPLOAD_FOLDER, filename)

                        with open(filepath, 'wb') as f:
                            f.write(file_data)

                        self.send_response(200)
                        self.send_cors_headers()  # Send CORS headers on success
                        self.send_header('Content-type', 'text/plain; charset=utf-8')
                        self.end_headers()
                        response_message = f'File "{filename}" has been uploaded and saved to "{UPLOAD_FOLDER}".'
                        self.wfile.write(response_message.encode('utf-8'))
                        logging.info(f'Successfully saved file: {filename} to {filepath}')
                        return
                    else:
                        logging.warning('Could not find file data in the multipart form.')
                        self.send_response(400)
                        self.send_cors_headers()  # Send CORS headers on failure
                        self.send_header('Content-type', 'text/plain; charset=utf-8')
                        self.end_headers()
                        self.wfile.write('No file data found in the upload.'.encode('utf-8'))
                        return

                except Exception as e:
                    logging.error(f'Error processing multipart/form-data: {e}')
                    self.send_response(500)
                    self.send_cors_headers()  # Send CORS headers on error
                    self.send_header('Content-type', 'text/plain; charset=utf-8')
                    self.end_headers()
                    self.wfile.write('Error processing file upload.'.encode('utf-8'))
                    return

            else:
                logging.warning(f'Received POST to /save with unsupported Content-Type: {content_type}')
                self.send_response(400)
                self.send_cors_headers()  # Send CORS headers for unsupported type
                self.send_header('Content-type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write('Unsupported Content-Type.'.encode('utf-8'))
        else:
            super().do_POST()

if __name__ == '__main__':
    PORT = 8075
    with socketserver.TCPServer(("", PORT), FileUploadHandler) as httpd:
        logging.info(f"Server started on port {PORT}")
        print(f"Server started on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logging.info("Server stopped by keyboard interrupt.")
            print("\nServer stopped.")
        except Exception as e:
            logging.critical(f"An unexpected error occurred: {e}")