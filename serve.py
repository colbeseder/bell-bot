from flask import *

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return send_file('web/index.html')

@app.route('/scripts/<path:path>')
def send_js(path):
    return send_from_directory('web/scripts', path)

@app.route('/styles/<path:path>')
def send_css(path):
    return send_from_directory('web/styles', path)

if __name__ == "__main__":
    app.run()