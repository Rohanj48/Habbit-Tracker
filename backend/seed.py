# seed.py

from datetime import date, timedelta, datetime, timezone
from models import db, Category, Habit, CheckIn
import random
from sqlalchemy.exc import IntegrityError

# --- Helper Functions ---

def get_or_create_category(session, name, color=None):
    """Checks if a category exists and creates it if not."""
    category = session.query(Category).filter_by(name=name).first()
    if not category:
        category = Category(name=name, color_code=color)
        session.add(category)
    return category

def create_daily_check_ins(habit_id, start_date, days):
    """Creates a successful check-in for a series of consecutive days."""
    check_ins = []
    for i in range(days):
        check_date = start_date + timedelta(days=i)
        check_ins.append(CheckIn(
            habit_id=habit_id,
            check_in_date=check_date,
            successful=True,
            note=f"Day {i+1} check-in."
        ))
    return check_ins

# --- Main Seeding Function ---

def seed_data(app):
    """
    Seeds the database with test data ONLY IF the Habit table is empty.
    """
    with app.app_context():
        # Check if we already have data
        if db.session.query(Habit).count() > 0:
            print("Database already contains habits. Skipping seeding.")
            return

        print("Seeding test data...")
        
        try:
            # --- 1. Add Categories ---
            health_cat = get_or_create_category(db.session, "Health", "#10B981") # Green
            work_cat = get_or_create_category(db.session, "Work", "#3B82F6")     # Blue
            learning_cat = get_or_create_category(db.session, "Learning", "#F59E0B") # Yellow
            
            # --- 2. Define Habits ---
            
            # Define timeframes relative to today
            today = date.today()
            three_weeks_ago = today - timedelta(weeks=3)
            
            # Habit 1: Daily Streak (21 days) - Perfect streak ending yesterday
            daily_streak_habit = Habit(
                name="Meditate (10 min)", 
                frequency="daily", 
                category=health_cat, 
                start_date=three_weeks_ago,
                target_count=1
            )
            
            # Habit 2: Weekly (3 times per week)
            weekly_habit = Habit(
                name="Gym Session", 
                frequency="weekly", 
                category=health_cat, 
                start_date=three_weeks_ago,
                target_count=3
            )

            # Habit 3: Broken Streak - Check-ins exist, but the streak stopped 5 days ago.
            broken_streak_start = today - timedelta(days=10)
            broken_streak_end = today - timedelta(days=5) # Last check-in date
            broken_streak_habit = Habit(
                name="Write 500 words", 
                frequency="daily", 
                category=work_cat, 
                start_date=broken_streak_start,
                target_count=1
            )

            # Habit 4: New Habit - Started today and checked in once.
            new_habit = Habit(
                name="Read technical book", 
                frequency="daily", 
                category=learning_cat, 
                start_date=today,
                target_count=1
            )

            db.session.add_all([daily_streak_habit, weekly_habit, broken_streak_habit, new_habit])
            db.session.flush() # Needed to assign habit_id before check-ins

            # --- 3. Add Check-ins ---
            
            # Check-ins for Habit 1 (Perfect Streak)
            db.session.add_all(create_daily_check_ins(
                daily_streak_habit.habit_id, 
                three_weeks_ago, 
                21 # Creates 21 check-ins, ending yesterday
            ))
            
            # Check-ins for Habit 2 (Weekly) - Add 9 successful check-ins randomly over 3 weeks
            for _ in range(9):
                # Pick a random date between start date and today
                random_days = random.randint(0, (today - three_weeks_ago).days)
                check_date = three_weeks_ago + timedelta(days=random_days)
                
                # Check for existing check-in to avoid IntegrityError
                existing = db.session.query(CheckIn).filter_by(habit_id=weekly_habit.habit_id, check_in_date=check_date).first()
                if not existing:
                    db.session.add(CheckIn(
                        habit_id=weekly_habit.habit_id,
                        check_in_date=check_date,
                        successful=True
                    ))
                    
            # Check-ins for Habit 3 (Broken streak) - 6 days of successful check-ins
            db.session.add_all(create_daily_check_ins(
                broken_streak_habit.habit_id,
                broken_streak_start,
                6
            ))
            
            # Check-in for Habit 4 (Checked in today)
            db.session.add(CheckIn(
                 habit_id=new_habit.habit_id,
                 check_in_date=today,
                 successful=True
            ))
            
            # Final Commit
            db.session.commit()
            print("Test data seeding complete.")

        except IntegrityError:
            db.session.rollback()
            print("Seeding failed due to a database integrity error (e.g., trying to add the same check-in date twice). Rolling back.")
        except Exception as e:
            db.session.rollback()
            print(f"An unexpected error occurred during seeding: {e}")