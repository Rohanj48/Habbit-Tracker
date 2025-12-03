from flask import Flask, jsonify
from flask_cors import CORS


from models import db, Habit, Category, CheckIn

def create_app():
    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/habit_hero.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


    db.init_app(app)
    

    @app.route('/api/test', methods=['GET'])
    def health_check():
        return "API and Database initialized (No routes defined yet)!"



    return app


if __name__ == '__main__':

    app = create_app()
    app.run(debug=True, port=5000)