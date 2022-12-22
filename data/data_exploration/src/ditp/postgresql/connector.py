import os

from sqlalchemy import create_engine
from sqlalchemy.engine.base import Connection



class PostgreSQLConnector:
    def __init__(self):
        self.user = os.getenv('PGUSER')
        self.password = os.getenv('PGPASSWORD')
        self.host = os.getenv('PGHOST')
        self.db = os.getenv('PGDATABASE')
        self.port = os.getenv('PGPORT')
        self.connection = self._get_connection()

    def _get_connection(self) -> Connection:
        connection_string = f'postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.db}'
        connector = create_engine(connection_string)
        connection = connector.connect()
        return connection
