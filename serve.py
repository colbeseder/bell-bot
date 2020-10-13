from flask import *

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return send_file('web/index.html')

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    return send_file('web/resources/favicon.ico')


@app.route('/resources/<path:path>')
def send_static(path):
    return send_from_directory('web/resources', path)

@app.route('/messages/<path:path>')
def get_messages(path):
    return send_from_directory('web/stubs', path)

if __name__ == "__main__":
    app.run()