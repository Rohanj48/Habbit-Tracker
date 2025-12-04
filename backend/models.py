from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import UniqueConstraint

# Initialize SQLAlchemy object here (unbound)
db = SQLAlchemy() 

# --- Category Model ---
class Category(db.Model):
    __tablename__ = 'category'
    
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    color_code = db.Column(db.String(7), nullable=True) 

    habits = db.relationship('Habit', backref='category', lazy=True)

    def __repr__(self):
        return f"<Category {self.name}>"

# --- Habit Model ---
class Habit(db.Model):
    __tablename__ = 'habit'
    
    habit_id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(10), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    target_count = db.Column(db.Integer, nullable=False, default=1)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)

    check_ins = db.relationship('CheckIn', backref='habit', lazy=True)

    def __repr__(self):
        return f"<Habit {self.name}>" # Simplified representation

# --- CheckIn Model ---
class CheckIn(db.Model):
    __tablename__ = 'check_in'
    
    check_in_id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.habit_id'), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    successful = db.Column(db.Boolean, nullable=False, default=True)
    note = db.Column(db.Text, nullable=True)
    units_tracked = db.Column(db.Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint('habit_id', 'check_in_date', name='_habit_date_uc'),
    )

    def __repr__(self):
        return f"<CheckIn Habit:{self.habit_id} Date:{self.check_in_date}>"