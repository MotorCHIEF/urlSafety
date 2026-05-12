from flask import Flask
from blueprints.auth.auth import authBP
from blueprints.reports.reports import reportsBP
from config import Config
from dotenv import load_dotenv
from flask_cors import CORS
from globals import mail
#Imports

load_dotenv() #parses .env file, which holds google api key
app = Flask(__name__)
CORS(app)

app.config.from_object(Config)

#email service information
app.config['MAIL_SERVER'] = 'sandbox.smtp.mailtrap.io'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = '##########'
app.config['MAIL_PASSWORD'] = '##########'
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@urlsafetycheck.com'
mail.init_app(app)

app.register_blueprint(authBP) #Blueprints
app.register_blueprint(reportsBP)

if __name__ == '__main__':
    app.run(debug=True)