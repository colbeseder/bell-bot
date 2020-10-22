from flask import *
import json, requests, re

dmp = ""

last_msg = None

def send_msg(url, text):
    global dmp
    if url == "" or text == "":
        return
    myobj = {
        "text": text
    }
    headers = {'Content-Type': 'application/json'}
    resp = requests.post(url, headers=headers, json=myobj)
    dmp = url + "\n\n" + json.dumps(myobj) + "\n\n" + str(resp)

counter = 1
messages_resp = {"messages":[]}
def got_message(msg_json):
    global messages_resp, counter, last_msg
    last_msg = msg_json
    messages_resp['messages'].append(
        {"id": counter, "from": msg_json['from']['name'], "body": re.sub(r'<at>[^>]+</at>|</?[^>]+>', '', msg_json['text']) }
    )
    counter += 1

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return send_file('web/index.html')

@app.route('/help', methods=['GET'])
def help():
    return send_file('web/help.html')

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    return send_file('web/resources/favicon.ico')

@app.route('/api/messages', methods=['GET', 'POST'])
def teams_in():
    global dmp
    #dmp = json.dumps(request.json)
    got_message(request.json)
    return send_from_directory('web/resources', 'ok.txt')

@app.route('/api/react', methods=['POST'])
def teams_out():
    send_msg(request.json['hook'], request.json['text'])
    return send_from_directory('web/resources', 'ok.txt')

@app.route('/api/dump', methods=['GET', 'POST'])
def m():
    global dmp, messages_resp
    return dmp

@app.route('/resources/<path:path>')
def send_static(path):
    return send_from_directory('web/resources', path)

@app.route('/images/<path:path>')
def send_images(path):
    return send_from_directory('web/images', path)



@app.route('/ChimeInManifest')
def get_manifest():
    return send_from_directory('web/manifest_package', 'ChimeIn.zip')


@app.route('/messages/<path:path>')
def get_messages(path):
    global messages_resp
    d = json.dumps(messages_resp)
    messages_resp = {"messages":[]}
    return d

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int("5000"), debug=True, ssl_context=('/etc/letsencrypt/live/bell.francecentral.cloudapp.azure.com/fullchain.pem',
 '/etc/letsencrypt/live/bell.francecentral.cloudapp.azure.com/privkey.pem'))
