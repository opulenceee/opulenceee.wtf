from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('config.env')

app = Flask(__name__)

# Database setup
DATABASE = 'faction.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_database():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create withdrawals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weapon_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create distributions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS distributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_name TEXT NOT NULL,
            weapon_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

# API Routes

@app.route('/api/withdrawals', methods=['GET'])
def get_withdrawals():
    """Get all withdrawals"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM withdrawals ORDER BY timestamp DESC')
        withdrawals = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(withdrawals)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/distributions', methods=['GET'])
def get_distributions():
    """Get all distributions"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM distributions ORDER BY timestamp DESC')
        distributions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(distributions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/withdrawals', methods=['POST'])
def add_withdrawal():
    """Add new withdrawal"""
    try:
        data = request.get_json()
        weapon_type = data.get('weapon_type')
        quantity = data.get('quantity')
        notes = data.get('notes', '')
        
        if not weapon_type or not quantity:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO withdrawals (weapon_type, quantity, notes) VALUES (?, ?, ?)',
            (weapon_type, quantity, notes)
        )
        
        withdrawal_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': withdrawal_id,
            'weapon_type': weapon_type,
            'quantity': quantity,
            'notes': notes,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/distributions', methods=['POST'])
def add_distribution():
    """Add new distribution"""
    try:
        data = request.get_json()
        member_name = data.get('member_name')
        weapon_type = data.get('weapon_type')
        quantity = data.get('quantity')
        notes = data.get('notes', '')
        
        if not member_name or not weapon_type or not quantity:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO distributions (member_name, weapon_type, quantity, notes) VALUES (?, ?, ?, ?)',
            (member_name, weapon_type, quantity, notes)
        )
        
        distribution_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': distribution_id,
            'member_name': member_name,
            'weapon_type': weapon_type,
            'quantity': quantity,
            'notes': notes,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/withdrawals/<int:withdrawal_id>', methods=['DELETE'])
def delete_withdrawal(withdrawal_id):
    """Delete withdrawal by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM withdrawals WHERE id = ?', (withdrawal_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({'deleted': deleted_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/distributions/<int:distribution_id>', methods=['DELETE'])
def delete_distribution(distribution_id):
    """Delete distribution by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM distributions WHERE id = ?', (distribution_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({'deleted': deleted_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/query', methods=['POST'])
def custom_query():
    """Execute custom SQL query (SELECT only)"""
    try:
        data = request.get_json()
        sql = data.get('sql', '')
        params = data.get('params', [])
        
        # Basic SQL injection protection - only allow SELECT statements
        if not sql.strip().lower().startswith('select'):
            return jsonify({'error': 'Only SELECT queries are allowed'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get application configuration"""
    try:
        config = {
            'password': os.getenv('FACTION_PASSWORD', 'SammyG2024!'),  # Fallback to hardcoded if not set
            'allowedIPs': [],  # Could be extended to use env vars
            'sessionTimeout': 3600000,  # 1 hour
        }
        return jsonify(config)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total withdrawals
        cursor.execute('SELECT SUM(quantity) as total FROM withdrawals')
        total_withdrawals = cursor.fetchone()['total'] or 0
        
        # Total distributions
        cursor.execute('SELECT SUM(quantity) as total FROM distributions')
        total_distributions = cursor.fetchone()['total'] or 0
        
        # Current month stats
        current_month = datetime.now().strftime('%Y-%m')
        
        cursor.execute(
            'SELECT SUM(quantity) as total FROM distributions WHERE strftime("%Y-%m", timestamp) = ?',
            (current_month,)
        )
        monthly_total = cursor.fetchone()['total'] or 0
        
        # Top member this month
        cursor.execute('''
            SELECT member_name, SUM(quantity) as total FROM distributions 
            WHERE strftime('%Y-%m', timestamp) = ?
            GROUP BY member_name 
            ORDER BY total DESC 
            LIMIT 1
        ''', (current_month,))
        top_member_row = cursor.fetchone()
        top_member = top_member_row['member_name'] if top_member_row else '-'
        
        # Top weapon this month
        cursor.execute('''
            SELECT weapon_type, SUM(quantity) as total FROM distributions 
            WHERE strftime('%Y-%m', timestamp) = ?
            GROUP BY weapon_type 
            ORDER BY total DESC 
            LIMIT 1
        ''', (current_month,))
        top_weapon_row = cursor.fetchone()
        top_weapon = top_weapon_row['weapon_type'] if top_weapon_row else '-'
        
        conn.close()
        
        return jsonify({
            'totalWithdrawals': total_withdrawals,
            'totalDistributions': total_distributions,
            'monthlyTotal': monthly_total,
            'topMember': top_member,
            'topWeapon': top_weapon
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve static files
@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'faction-manager.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from parent directory"""
    return send_from_directory('../assets', filename)

@app.route('/styles.css')
def serve_main_css():
    """Serve main CSS from parent directory"""
    return send_from_directory('..', 'styles.css')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    
    # Run the Flask app
    print("Faction Manager server starting...")
    print("Access the application at: http://localhost:5000")
    
    # Use debug=False for production
    import os
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='127.0.0.1', port=5110) 
