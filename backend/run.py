import os
import sys

# Ensure root directory is in sys.path so 'backend' package can be imported from anywhere
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.app import create_app
from backend.app.extensions import db
from sqlalchemy import text

app = create_app()


def check_database_connection():
    """Return False and print a friendly message when MySQL is unavailable."""
    try:
        with app.app_context():
            with db.engine.connect() as connection:
                connection.execute(text('SELECT 1'))
        return True
    except Exception as error:
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "unknown")
        print(f'\nUnable to connect to the MySQL database target: {db_uri}', file=sys.stderr)
        print('Please make sure your database credentials and DATABASE_URL on Render are correct.', file=sys.stderr)
        print(f'Database error: {error}', file=sys.stderr)
        print('The API was not started.\n', file=sys.stderr)
        return False


if __name__ == '__main__':
    if not check_database_connection():
        raise SystemExit(1)

    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 ThreadCraft Luxe Flask REST API starting on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)