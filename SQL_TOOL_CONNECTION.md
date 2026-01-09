# הוראות התחברות ל-SQL Tool

## פרטי החיבור (Connection Settings)

כאשר פותחים חיבור חדש ב-SQL Tool (DBeaver, pgAdmin, DataGrip, DataGrip, או כל כלי SQL אחר), הגדירי:

### פרטים בסיסיים (Basic Settings):

```
Host / Server:    127.0.0.1
                  (או localhost - אבל 127.0.0.1 עדיף)

Port:             5432

Database:         tommy_game_db

Username:         postgres

Password:         postgres
```

### Connection String (אם הכלי תומך):

```
postgresql://postgres:postgres@127.0.0.1:5432/tommy_game_db
```

### JDBC URL (לכלים שמשתמשים ב-JDBC):

```
jdbc:postgresql://127.0.0.1:5432/tommy_game_db
```

---

## הוראות ספציפיות לכלי:

### DBeaver:
1. File → New → Database Connection
2. בחרי **PostgreSQL**
3. מלאי:
   - **Host**: `127.0.0.1`
   - **Port**: `5432`
   - **Database**: `tommy_game_db`
   - **Username**: `postgres`
   - **Password**: `postgres`
4. לחצי **Test Connection**
5. אם זה לא עובד, תחת **Driver properties** → הוסף:
   - `ssl` = `false`

### pgAdmin:
1. לחצי ימני על **Servers** → **Create** → **Server**
2. ב-General:
   - **Name**: `Tommy Game DB`
3. ב-Connection:
   - **Host**: `127.0.0.1`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `postgres`
   - **Password**: `postgres`
4. שמרי והתחברי
5. לאחר ההתחברות, תוכלי לראות את `tommy_game_db` תחת Databases

### DataGrip / IntelliJ IDEA:
1. File → New → Data Source → PostgreSQL
2. מלאי:
   - **Host**: `127.0.0.1`
   - **Port**: `5432`
   - **Database**: `tommy_game_db`
   - **User**: `postgres`
   - **Password**: `postgres`
3. לחצי **Test Connection**

---

## פתרון בעיות נפוצות:

### שגיאה: "database tommy_game_db does not exist"

**פתרון 1**: ודאי ש-Docker container רץ:
```bash
docker ps
```

אם הקונטיינר לא רץ, הרצי:
```bash
docker-compose up -d db
```

**פתרון 2**: המסד קיים ב-Docker, אבל אולי את מתחברת ל-PostgreSQL המקומי.

נסי:
1. בדקי איזה PostgreSQL מאזין על פורט 5432:
   ```bash
   netstat -ano | findstr :5432
   ```

2. אם יש שני שרתים, ודאי שאת מתחברת ל-Docker:
   - Docker map את הפורט `0.0.0.0:5432->5432/tcp`
   - נסי להתחבר עם `127.0.0.1` במקום `localhost`

**פתרון 3**: ליצור את המסד ב-PostgreSQL המקומי (אם את רוצה להשתמש בו):
```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "CREATE DATABASE tommy_game_db;"
```

### שגיאה: "connection refused" או "could not connect"

1. ודאי ש-PostgreSQL container רץ:
   ```bash
   docker ps --filter "name=tommy_game_db"
   ```

2. בדקי שהפורט 5432 פתוח:
   ```bash
   netstat -ano | findstr :5432
   ```

3. נסי להתחבר דרך Docker ישירות:
   ```bash
   docker exec tommy_game_db psql -U postgres -d tommy_game_db
   ```

### שגיאה: "password authentication failed" או "authentication failed"

**הסיבה**: את כנראה מתחברת ל-PostgreSQL המקומי במקום ל-Docker, והסיסמה שם שונה.

**פתרון 1**: ודאי ש-Docker container רץ וש-SQL Tool מתחבר אליו:
```bash
docker ps --filter "name=tommy_game_db"
```

**פתרון 2**: נסי להתחבר ישירות ל-Docker:
```bash
docker exec tommy_game_db psql -U postgres -d tommy_game_db
```
אם זה עובד, הבעיה היא ב-SQL Tool.

**פתרון 3**: אם את רוצה להשתמש ב-PostgreSQL המקומי, שחרי את הסיסמה:
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

**פתרון 4**: ודאי שאין רווח בסוף שם המשתמש - לפעמים SQL Tools מוסיפים רווח
- בדקי שהשדה Username הוא בדיוק: `postgres` (ללא רווחים)
- בדקי שהשדה Password הוא בדיוק: `postgres` (ללא רווחים)

**פתרון 5**: נסי להתחבר עם `127.0.0.1` במקום `localhost` (לפעמים זה עוזר)

---

## בדיקה מהירה שהכל עובד:

הרצי את הפקודה הזו ב-PowerShell:
```powershell
docker exec tommy_game_db psql -U postgres -d tommy_game_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

אם זה עובד, אמור להציג את מספר הטבלאות (צריך להיות 5).

---

## טיפים:

1. **שמור את החיבור** - אחרי שהחיבור עובד, שמרי אותו ב-SQL Tool שלך
2. **Test Connection** - תמיד נסי Test Connection לפני שמירה
3. **127.0.0.1 vs localhost** - ב-Windows, לפעמים `127.0.0.1` עובד טוב יותר מ-`localhost`
4. **SSL** - בדרך כלל לא צריך SSL לחיבור מקומי, אז כבי את זה אם יש שגיאה

---

## אם כלום לא עובד:

1. ודאי ש-Docker Desktop רץ
2. בדקי ש-`tommy_game_db` container רץ:
   ```bash
   docker ps
   ```
3. בדקי את הלוגים:
   ```bash
   docker logs tommy_game_db
   ```
4. נסי להריץ את האפליקציה - היא תיצור את המסד אוטומטית:
   ```bash
   uvicorn main:app --reload
   ```

