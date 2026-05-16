from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Counter state
counter = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/counter', methods=['GET'])
def get_counter():
    return f'<div id="counter">{counter}</div>'

@app.route('/increment', methods=['POST'])
def increment():
    global counter
    counter += 1
    return f'<div id="counter">{counter}</div>'

@app.route('/reset', methods=['POST'])
def reset():
    global counter
    counter = 0
    return f'<div id="counter">{counter}</div>'

if __name__ == '__main__':
    app.run(debug=True)