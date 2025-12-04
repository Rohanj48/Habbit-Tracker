from flask import Flask, jsonify, request
from flask_cors import CORS 
from flask_sqlalchemy import SQLAlchemy
from models import db, Habit, Category, CheckIn
from seed import seed_data
from datetime import date, timedelta

# --- HELPER FUNCTIONS ---
def calculate_streak(habit_id):
    """
    Calculates the current consecutive daily streak and due status for a given habit.
    Returns: (streak_length: int, is_due_today: bool)
    """
    today = date.today()
    
    # Get the latest check-in date
    last_check_in_q = CheckIn.query.filter_by(habit_id=habit_id) \
                                   .order_by(CheckIn.check_in_date.desc()) \
                                   .first()
    
    # Case 1: No check-ins yet
    if not last_check_in_q:
        return 0, True 

    last_check_in_date = last_check_in_q.check_in_date
    
    # Determine 'is_due'
    checked_in_today = (last_check_in_date == today)
    is_due = not checked_in_today

    # Determine starting date for streak calculation
    if checked_in_today:
        streak_days = 1
        current_date = today - timedelta(days=1)
    elif last_check_in_date == today - timedelta(days=1):
        # Last check-in was yesterday, streak is currently 1 (or more), and is due today
        streak_days = 0 
        current_date = last_check_in_date
    else:
        # Last check-in was older than yesterday (streak broken)
        return 0, True

    # Iterate backwards to calculate streak
    while True:
        check_in = CheckIn.query.filter_by(habit_id=habit_id, check_in_date=current_date).first()
        
        if check_in:
            streak_days += 1
            current_date -= timedelta(days=1)
        else:
            break
            
    return streak_days, is_due


# --- APPLICATION FACTORY ---
def create_app():
    app = Flask(__name__)
    
    # Configure SQLite database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///habit_tracker.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    CORS(app) # Initialize CORS
    
    # Initialize database with the app
    db.init_app(app)
    
    # Register API route for viewing data
    @app.route('/api/data', methods=['GET'])
    def get_all_data():
        """Fetches all habits, calculating dynamic metrics like streak and due status."""
        
        try:
            today = date.today()
            
            # Fetch all habits along with their category and check-ins
            habits_data = Habit.query.all()
            
            output = []
            for habit in habits_data:
                # Get category name
                category_name = habit.category.name if habit.category else 'Uncategorized'
                
                # --- Dynamic Streak and Due Calculation ---
                # The error is likely occurring inside or around this call
                streak_days, is_due = calculate_streak(habit.habit_id)
                
                # Count successful check-ins (basic implementation)
                check_ins_count = CheckIn.query.filter_by(habit_id=habit.habit_id).count()
                
                habit_info = {
                    'id': habit.habit_id,
                    'name': habit.name,
                    'frequency': habit.frequency,
                    'start_date': habit.start_date.isoformat(),
                    'category': category_name,
                    'target_count': habit.target_count,
                    'total_check_ins': check_ins_count,
                    'is_due_today': is_due,
                    'mock_current_streak': streak_days,
                    'check_ins': [
                        {'date': ci.check_in_date.isoformat(), 'successful': ci.successful} 
                        for ci in habit.check_ins
                    ]
                }
                output.append(habit_info)

            return jsonify(habits=output)
        
        except Exception as e:
            # THIS IS THE FIX: Return JSON on failure, preventing the SyntaxError in the frontend
            print(f"Error fetching habits: {e}")
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


    @app.route('/api/checkin', methods=['POST'])
    def checkin_habit():
        """Handles recording a new check-in for a habit by writing to the database."""
        
        # 1. Get and validate JSON data
        data = request.get_json()
        habit_id = data.get('habit_id')

        if not habit_id:
            return jsonify({"message": "Missing habit_id"}), 400

        try:
            habit_id = int(habit_id)
        except ValueError:
            return jsonify({"message": "habit_id must be a valid integer"}), 400

        # 2. Find the habit
        habit = Habit.query.get(habit_id)
        if not habit:
            return jsonify({"message": f"Habit with ID {habit_id} not found"}), 404
        
        # 3. Prevent double check-in (check the database)
        today = date.today()
        existing_checkin = CheckIn.query.filter_by(habit_id=habit_id, check_in_date=today).first()

        if existing_checkin:
            return jsonify({"message": "Habit already checked in today"}), 409

        # 4. Create the new CheckIn record and save to DB
        new_checkin = CheckIn(
            habit_id=habit_id,
            check_in_date=today,
            successful=True
        )
        
        try:
            db.session.add(new_checkin)
            db.session.commit()
            return jsonify({"message": "Habit checked in successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Database error during check-in: {str(e)}"}), 500
    
    @app.route('/api/habits', methods=['POST'])
    def create_habit():
        """Handles the creation of a new habit based on form data."""
        data = request.get_json()
        name = data.get('name')
        frequency = data.get('frequency')
        category_name = data.get('category')
        
        if not name or not frequency or not category_name:
            return jsonify({"message": "Missing required fields (name, frequency, category)"}), 400

        try:
            # Get the category ID (or create the category if it doesn't exist, though for now we rely on seed)
            category = Category.query.filter_by(name=category_name).first()
            if not category:
                # If category doesn't exist, create it. (Extending the system a bit)
                category = Category(name=category_name)
                db.session.add(category)
                db.session.flush() # Flush to get the ID before committing the habit
            
            # Create the new habit
            new_habit = Habit(
                name=name,
                frequency=frequency,
                start_date=date.today(),
                category_id=category.category_id,
                target_count=1 # Default to 1 for simplicity
            )
            
            db.session.add(new_habit)
            db.session.commit()

            return jsonify({
                "message": "Habit created successfully",
                "habit": {
                    "id": new_habit.habit_id,
                    "name": new_habit.name,
                    "category": category_name,
                    "frequency": new_habit.frequency
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            print(f"Error creating habit: {e}")
            return jsonify({"message": f"Database error creating habit: {str(e)}"}), 500

    return app




if __name__ == '__main__':

    app = create_app()
    
    with app.app_context():
        db.drop_all() 
        db.create_all()
        
        # 2. Seed the data
        seed_data(app)
        
    # 3. Run the application
    print("Database tables created and seeded. Access /api/data to view the data.")
    app.run(debug=True)