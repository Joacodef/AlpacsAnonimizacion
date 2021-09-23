from json import dumps
import logging

logger = logging.getLogger('root')

class DBManager():
    conn = None
    cursor = None
    db_config = None
    db_functions = {}

    def __init__(self, db_config):
        self.db_config = db_config
        self.connect()
        try:
            if True in self.db_config["create_table"]:
                self.init_table()
            self.init_functions()
        except Exception as e:
            logger.error("Unexpected exception at DBManager initialization: {0}".format(e))
            raise

    # Retorna la query necesaria para crear la tabla en la BD
    def init_table(self):
        sql_type = self.db_config["sql_type"]
        db_class = self.db_config["db_class"]
        table_name = self.db_config["table_name"]
        create_table = self.db_config["create_table"]
        create_query =  {
                            "sqlite3": {
                                "execute_function": "executescript",
                                "PrivateDB": {
                                    f"CREATE TABLE IF NOT EXISTS {table_name[0] if len(table_name) > 0 else 'lat'}(ourid INTEGER PRIMARY KEY AUTOINCREMENT, originalid TEXT UNIQUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
                                },
                                "ReportDB": { 
                                    f"CREATE TABLE IF NOT EXISTS {table_name[0] if len(table_name) > 0 else 'reportInstance'}(patient_id INTEGER NOT NULL, sent_to_curation BOOLEAN, bodypart_translated BOOLEAN, study_instance_uid TEXT NOT NULL, series_instance_uid TEXT NOT NULL, sop_instance_uid TEXT PRIMARY KEY NOT NULL, approved BOOLEAN, RULES TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)",
                                    f"CREATE TABLE IF NOT EXISTS {table_name[1] if len(table_name) > 1 else 'reportSerie'}(series_instance_uid TEXT PRIMARY KEY, available_instances TEXT, missing_instances TEXT, correlatives BOOLEAN, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
                                }
                            },
                            "postgresql": {
                                "execute_function": "execute",
                                "PrivateDB": {
                                    f"CREATE TABLE IF NOT EXISTS {table_name[0] if len(table_name) > 0 else 'lat'}(ourid SERIAL PRIMARY KEY, originalid TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
                                },
                                "ReportDB": {
                                    f"CREATE TABLE IF NOT EXISTS {table_name[0] if len(table_name) > 0 else 'reportInstance'}(patient_id INTEGER NOT NULL, sent_to_curation BOOLEAN, bodypart_translated BOOLEAN, study_instance_uid TEXT NOT NULL, series_instance_uid TEXT NOT NULL, sop_instance_uid TEXT PRIMARY KEY NOT NULL, approved BOOLEAN, RULES JSON, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)",
                                    f"CREATE TABLE IF NOT EXISTS {table_name[1] if len(table_name) > 1 else 'reportSerie'}(series_instance_uid TEXT PRIMARY KEY, available_instances JSON, missing_instances JSON, correlatives BOOLEAN, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
                                }
                            }
                        }
        create_function = {
                            "sqlite3": f";",
                            "postgresql": f"CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;"
                        }
        create_trigger = {
                            "sqlite3": {
                                "PrivateDB": {
                                    f";",
                                },
                                "ReportDB": {
                                    f";",
                                    f";",
                                }
                            },
                            "postgresql": {
                                "PrivateDB": {
                                    f"DROP TRIGGER IF EXISTS set_timestamp on {table_name[0] if len(table_name) > 0 else 'lat'}; CREATE TRIGGER set_timestamp BEFORE UPDATE ON {table_name[0] if len(table_name) > 0 else 'lat'} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();"
                                },
                                "ReportDB": {
                                    f"DROP TRIGGER IF EXISTS set_timestamp on {table_name[0] if len(table_name) > 0 else 'reportInstance'}; CREATE TRIGGER set_timestamp BEFORE UPDATE ON {table_name[0] if len(table_name) > 0 else 'reportInstance'} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
                                    f"DROP TRIGGER IF EXISTS set_timestamp on {table_name[1] if len(table_name) > 1 else 'reportSerie'}; CREATE TRIGGER set_timestamp BEFORE UPDATE ON {table_name[1] if len(table_name) > 1 else 'reportSerie'} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
                                }
                            }
                        }
        query = ';'.join([q*create_table[i] for i, q in enumerate(create_query[sql_type][db_class])]) + ";" + create_function[sql_type] + ";" + ';'.join([q*create_table[i] for i, q in enumerate(create_trigger[sql_type][db_class])])
        getattr(self.cursor, create_query[sql_type]["execute_function"])(query)
        return self.conn.commit()

    # Formatea las queries utilizadas en el componente según la BD a utilizar
    def init_functions(self):
        table_name = self.db_config["table_name"]
        self.db_functions = {
            "sqlite3": {
                # Get patient ID
                "get_ourid_query": f"SELECT ourid FROM {table_name[0] if len(table_name) > 0 else 'lat'} WHERE originalid=?",
                "get_ourid": self.get_one_sqlite3,
                # Insert patient ID
                "insert_patientid_query": f"INSERT INTO {table_name[0] if len(table_name) > 0 else 'lat'} (originalid) VALUES (?) ON CONFLICT (originalid) DO NOTHING",
                "get_insert_patientid": self.get_insert_id_sqlite3,
                # Insert report instance
                "insert_report_instance_query": f"INSERT INTO {table_name[0] if len(table_name) > 0 else 'reportInstance'} (patient_id, sent_to_curation, bodypart_translated, study_instance_uid, series_instance_uid, sop_instance_uid, approved, rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (sop_instance_uid) DO UPDATE SET patient_id = EXCLUDED.patient_id, sent_to_curation = EXCLUDED.sent_to_curation, bodypart_translated = EXCLUDED.bodypart_translated, study_instance_uid = EXCLUDED.study_instance_uid, series_instance_uid = EXCLUDED.series_instance_uid, approved = EXCLUDED.approved, rules = EXCLUDED.rules",
                # Get report serie
                "get_report_serie_query": f"SELECT available_instances, missing_instances, correlatives FROM {table_name[1] if len(table_name) > 1 else 'reportSerie'} WHERE series_instance_uid=?",
                "get_report_serie": self.get_tuple_sqlite3,
                # Insert report serie
                "insert_report_serie_query": f"INSERT INTO {table_name[1] if len(table_name) > 1 else 'reportSerie'} (series_instance_uid, available_instances, missing_instances, correlatives) VALUES (?, ?, ?, ?) ON CONFLICT (series_instance_uid) DO UPDATE SET available_instances = EXCLUDED.available_instances, missing_instances = EXCLUDED.missing_instances, correlatives = EXCLUDED.correlatives",
                "check_version": "Select sqlite_version();"
            },
            "postgresql": {
                # Get patient ID
                "get_ourid_query": f"SELECT ourid FROM {table_name[0] if len(table_name) > 0 else 'lat'} WHERE originalid=%s",
                "get_ourid": self.get_postgresql,
                # Insert patient ID
                "insert_patientid_query": f"INSERT INTO {table_name[0] if len(table_name) > 0 else 'lat'} (originalid) VALUES (%s) RETURNING ourid",
                "get_insert_patientid": self.get_postgresql,
                # Insert report instance
                "insert_report_instance_query": f"INSERT INTO {table_name[0] if len(table_name) > 0 else 'reportInstance'} (patient_id, sent_to_curation, bodypart_translated, study_instance_uid, series_instance_uid, sop_instance_uid, approved, rules) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (sop_instance_uid) DO UPDATE SET patient_id = EXCLUDED.patient_id, sent_to_curation = EXCLUDED.sent_to_curation, bodypart_translated = EXCLUDED.bodypart_translated, study_instance_uid = EXCLUDED.study_instance_uid, series_instance_uid = EXCLUDED.series_instance_uid, approved = EXCLUDED.approved, rules = EXCLUDED.rules",
                # Get report serie
                "get_report_serie_query": f"SELECT available_instances, missing_instances, correlatives FROM {table_name[1] if len(table_name) > 1 else 'reportSerie'} WHERE series_instance_uid=%s",
                "get_report_serie": self.get_tuple_postgresql,
                # Insert report serie
                "insert_report_serie_query": f"INSERT INTO {table_name[1] if len(table_name) > 1 else 'reportSerie'} (series_instance_uid, available_instances, missing_instances, correlatives) VALUES (%s, %s, %s, %s) ON CONFLICT (series_instance_uid) DO UPDATE SET available_instances = EXCLUDED.available_instances, missing_instances = EXCLUDED.missing_instances, correlatives = EXCLUDED.correlatives",
                "check_version": "Select version();"
            }
        }

    # SQL Functions
    # SQLite
    def get_one_sqlite3(self):
        fetch = self.cursor.fetchone()
        if fetch: return fetch[0]
        else: return None
    def get_tuple_sqlite3(self):
        fetch = self.cursor.fetchone()
        if fetch: return fetch
        else: return None
    def get_insert_id_sqlite3(self):
        return self.cursor.lastrowid

    # PostgreSQL
    # PostgreSQL retorna el id tanto en busqueda como en inserción
    def get_postgresql(self):
        fetch = self.cursor.fetchone()
        if fetch: return fetch[0]
        else: return None
    def get_tuple_postgresql(self):
        fetch = self.cursor.fetchone()
        if fetch: return fetch
        else: return None

    # Conexion a BD
    def connect(self):
        try:
            if self.db_config["sql_type"] == "sqlite3":
                import sqlite3
                self.conn = sqlite3.connect(self.db_config["db_name"], check_same_thread=False)
            elif self.db_config["sql_type"] == "postgresql":
                import psycopg2
                self.conn = psycopg2.connect("host={3} port={4} dbname={0} user={1} password={2}".format(self.db_config["db_name"], self.db_config["db_user"],self. db_config["db_password"], self.db_config["host"], self.db_config["port"]))
            self.cursor = self.conn.cursor()
        except Exception as e:
            logger.error("Failed to connect to database with error: {0}".format(e))
            raise

    def check_alive(self):
        try:
            self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["check_version"])
        except:
            logger.info("Connection to Database failed. Reconnecting...")
            self.connect()

    def get_ourid(self, encrypted_id):
        self.check_alive()
        self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["get_ourid_query"], (encrypted_id, ))
        return self.db_functions[self.db_config["sql_type"]]["get_ourid"]()

    def get_insert_patientid(self, encrypted_id):
        self.check_alive()
        print("Encrypted ID: ", encrypted_id)
        print("Query: ",self.db_functions[self.db_config["sql_type"]]["insert_patientid_query"])
        self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["insert_patientid_query"], (encrypted_id, ))
        self.conn.commit()
        return self.db_functions[self.db_config["sql_type"]]["get_insert_patientid"]()

    def insert_report_instance(self, report):
        self.check_alive()
        self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["insert_report_instance_query"], 
                            (
                                report["metadata"]["patient_id"],
                                report["metadata"]["sent_to_curation"],
                                report["metadata"]["bodypart_translated"],
                                report["metadata"]["study_instance_uid"],
                                report["metadata"]["series_instance_uid"],
                                report["metadata"]["sop_instance_uid"],
                                report["metadata"]["approved"],
                                dumps(report["rules"])
                            )
                        )
        self.conn.commit()

    def get_report_serie(self, serie):
        self.check_alive()
        self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["get_report_serie_query"], (serie, ))
        self.conn.commit()
        return self.db_functions[self.db_config["sql_type"]]["get_report_serie"]()

    def insert_report_serie(self, report):
        self.check_alive()
        self.cursor.execute(self.db_functions[self.db_config["sql_type"]]["insert_report_serie_query"],
                            (
                            report["series_instance_uid"],
                            dumps(report["available_instances"]),
                            dumps(report["missing_instances"]),
                            report["correlatives"]
                            )
                        )
        self.conn.commit()
