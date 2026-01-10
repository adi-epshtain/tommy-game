# מדריך לעדכון Score של Session ב-SQL Tool

## פרטי התחברות ל-PostgreSQL

### אם אתה מתחבר ל-Docker Container:
- **Host**: `127.0.0.1` או `localhost`
- **Port**: `5432`
- **Database**: `tommy_game_db`
- **Username**: `postgres`
- **Password**: `postgres`

### אם אתה מתחבר ישירות (ללא Docker):
- **Host**: `127.0.0.1`
- **Port**: `5432` (או הפורט שבו PostgreSQL רץ)
- **Database**: `tommy_game_db`
- **Username**: `postgres`
- **Password**: `postgres` (או הסיסמה שלך)

---

## מבנה הטבלה `player_sessions`

```sql
CREATE TABLE player_sessions (
    id INTEGER PRIMARY KEY,
    player_id INTEGER,
    game_id INTEGER,
    score INTEGER DEFAULT 0,
    stage INTEGER DEFAULT 1,
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);
```

---

## שאילתות שימושיות

### 1. מצא את ה-Session ID שברצונך לערוך

#### ראה את כל ה-Sessions של שחקן ספציפי:
```sql
SELECT 
    ps.id AS session_id,
    p.name AS player_name,
    ps.score,
    ps.stage,
    ps.started_at,
    ps.ended_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE p.name = 'שם השחקן'
ORDER BY ps.started_at DESC;
```

#### ראה את כל ה-Sessions עם הציונים הגבוהים ביותר:
```sql
SELECT 
    ps.id AS session_id,
    p.name AS player_name,
    ps.score,
    ps.stage,
    ps.started_at,
    ps.ended_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.ended_at IS NOT NULL
ORDER BY ps.score DESC
LIMIT 20;
```

#### מצא Session לפי ID:
```sql
SELECT 
    ps.id AS session_id,
    p.name AS player_name,
    ps.score,
    ps.stage,
    ps.started_at,
    ps.ended_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.id = 123;  -- החלף 123 ב-Session ID שברצונך לערוך
```

---

### 2. עדכן Score של Session ספציפי

#### עדכון Score לפי Session ID:
```sql
UPDATE player_sessions
SET score = 100  -- החלף 100 בציון הרצוי
WHERE id = 123;  -- החלף 123 ב-Session ID שברצונך לערוך
```

#### עדכון Score של Session אחרון של שחקן מסוים:
```sql
UPDATE player_sessions
SET score = 50  -- החלף 50 בציון הרצוי
WHERE player_id = (
    SELECT id FROM players WHERE name = 'שם השחקן'
)
AND id = (
    SELECT id FROM player_sessions 
    WHERE player_id = (SELECT id FROM players WHERE name = 'שם השחקן')
    ORDER BY started_at DESC 
    LIMIT 1
);
```

#### עדכון Score של כל ה-Sessions של שחקן מסוים:
```sql
UPDATE player_sessions
SET score = score + 10  -- הוסף 10 לכל הציונים (דוגמה)
WHERE player_id = (
    SELECT id FROM players WHERE name = 'שם השחקן'
);
```

---

### 3. בדוק את התוצאה

```sql
SELECT 
    ps.id AS session_id,
    p.name AS player_name,
    ps.score,
    ps.stage,
    ps.started_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.id = 123;  -- החלף 123 ב-Session ID שערכת
```

---

## דוגמה מלאה: עדכון Score

### שלב 1: מצא את ה-Session
```sql
-- ראה את כל ה-Sessions של "טומי"
SELECT 
    ps.id,
    p.name,
    ps.score,
    ps.started_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE p.name = 'טומי'
ORDER BY ps.started_at DESC;
```

### שלב 2: עדכן את ה-Score
```sql
-- עדכן את ה-Score של Session ID 5 ל-25
UPDATE player_sessions
SET score = 25
WHERE id = 5;
```

### שלב 3: ודא שהעדכון הצליח
```sql
-- בדוק את ה-Session שערכת
SELECT 
    ps.id,
    p.name,
    ps.score,
    ps.started_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.id = 5;
```

---

## מחיקה (DELETE)

### מחק Session ספציפי:
```sql
DELETE FROM player_sessions
WHERE id = 123;  -- החלף 123 ב-Session ID שברצונך למחוק
```

**⚠️ אזהרה**: מחיקת Session תמחק גם את כל ה-Answers הקשורים אליו (אם יש foreign key cascade).

### מחק כל ה-Sessions של שחקן מסוים:
```sql
DELETE FROM player_sessions
WHERE player_id = (
    SELECT id FROM players WHERE name = 'שם השחקן'
);
```

### מחק Sessions ישנים (למשל, לפני תאריך מסוים):
```sql
DELETE FROM player_sessions
WHERE started_at < '2024-01-01';  -- מחק Sessions לפני 1 בינואר 2024
```

### מחק Sessions שלא הסתיימו (בדוק קודם):
```sql
-- בדוק קודם כמה יש:
SELECT COUNT(*) FROM player_sessions WHERE ended_at IS NULL;

-- מחק (זהירות!):
DELETE FROM player_sessions
WHERE ended_at IS NULL;
```

---

## עריכה ישירה בטבלה (Table Editor)

רוב כלי ה-SQL מאפשרים עריכה ישירה בטבלה:

### ב-DataGrip / PyCharm:
1. פתחי את הטבלה `player_sessions` מהמבנה
2. לחצי ימני על הטבלה → **"Jump to Data"** או **"Open Table"**
3. תראי את כל ה-Rows
4. לחצי על ה-Cell שברצונך לערוך → ערכי ישירות
5. לחצי **Ctrl+Enter** (או כפתור Save) לשמירה

### ב-pgAdmin:
1. פתחי את הטבלה `player_sessions`
2. לחצי על טאב **"Data Output"**
3. לחצי על ה-Row שברצונך לערוך
4. ערכי ישירות
5. לחצי על כפתור **"Save"**

### ב-DBeaver:
1. פתחי את הטבלה `player_sessions`
2. לחצי ימני על הטבלה → **"Edit Data"**
3. ערכי ישירות
4. לחצי **Ctrl+S** לשמירה

---

## עדכון מתקדם (UPDATE עם JOIN)

### עדכן Score לפי שם שחקן:
```sql
UPDATE player_sessions
SET score = 50
WHERE player_id IN (
    SELECT id FROM players WHERE name = 'טומי'
)
AND id = 123;
```

### עדכן Score רק ל-Sessions שנסיימו:
```sql
UPDATE player_sessions
SET score = 20
WHERE id = 123
AND ended_at IS NOT NULL;
```

### עדכן Score ל-Session האחרון של שחקן:
```sql
WITH last_session AS (
    SELECT id 
    FROM player_sessions 
    WHERE player_id = (SELECT id FROM players WHERE name = 'טומי')
    ORDER BY started_at DESC 
    LIMIT 1
)
UPDATE player_sessions
SET score = 30
WHERE id = (SELECT id FROM last_session);
```

---

## אזהרות חשובות

1. **גיבוי**: לפני ביצוע עדכונים או מחיקות, עשי גיבוי של הנתונים
2. **בדיקות**: תמיד תבדקי את התוצאה אחרי עדכון/מחיקה
3. **Cache**: אם יש Redis cache, יתכן שתצטרכי לנקות אותו או לחכות כמה דקות
4. **Transaction**: השתמשי ב-BEGIN/COMMIT לביטחון:
   ```sql
   BEGIN;  -- התחל transaction
   UPDATE player_sessions SET score = 25 WHERE id = 123;
   -- בדוק את התוצאה
   SELECT * FROM player_sessions WHERE id = 123;
   -- אם הכל טוב:
   COMMIT;  -- שמור את השינויים
   -- או:
   ROLLBACK;  -- בטל את השינויים
   ```
5. **Cascade Delete**: מחיקת Session עלולה למחוק גם Answers קשורים (תלוי ב-Foreign Key constraints)

---

## ניקוי Cache (אם צריך)

אם אתה רואה שהשינויים לא מתעדכנים בלוח התוצאות, יתכן שצריך לנקות את ה-Redis cache:

```bash
# דרך Docker
docker exec -it tommy_game_redis redis-cli FLUSHALL
```

או דרך psql:
```sql
-- Redis לא נגיש דרך SQL, צריך לעשות דרך Docker
-- אבל אפשר לבדוק אם יש בעיות ב-cache
```

---

## טיפים נוספים

### עדכון Score ו-Stage יחד:
```sql
UPDATE player_sessions
SET 
    score = 30,
    stage = 2
WHERE id = 123;
```

### עדכון רק Sessions שנסיימו:
```sql
UPDATE player_sessions
SET score = 20
WHERE id = 123
AND ended_at IS NOT NULL;
```

### עדכון עם תנאי:
```sql
UPDATE player_sessions
SET score = 15
WHERE id = 123
AND score < 10;  -- רק אם הציון נמוך מ-10
```

---

## עדכון מיוחד: הורדת ציונים גבוהים (מלבד שחקן מסוים)

### עדכן את כל ה-Sessions עם score > 5 ל-5, פרט לטומי:

#### שלב 1: בדוק כמה Sessions יושפעו:
```sql
SELECT 
    ps.id,
    p.name AS player_name,
    ps.score,
    ps.started_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.score > 5
AND p.name != 'טומי'
ORDER BY ps.score DESC;
```

#### שלב 2: עדכן את כל ה-Sessions:
```sql
UPDATE player_sessions
SET score = 5
WHERE score > 5
AND player_id != (
    SELECT id FROM players WHERE name = 'טומי'
);
```

#### שלב 3: בדוק את התוצאה:
```sql
-- בדוק כמה Sessions נשארו עם score > 5 (אמור להיות רק של טומי):
SELECT 
    ps.id,
    p.name AS player_name,
    ps.score,
    ps.started_at
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.score > 5
ORDER BY ps.score DESC;
```

### גרסה בטוחה עם Transaction:
```sql
-- התחל transaction לביטחון
BEGIN;

-- בדוק מה יושפע:
SELECT 
    COUNT(*) AS sessions_to_update,
    SUM(ps.score) AS total_current_score
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.score > 5
AND p.name != 'טומי';

-- עדכן:
UPDATE player_sessions
SET score = 5
WHERE score > 5
AND player_id != (
    SELECT id FROM players WHERE name = 'טומי'
);

-- בדוק את התוצאה:
SELECT 
    p.name AS player_name,
    ps.score,
    COUNT(*) AS session_count
FROM player_sessions ps
JOIN players p ON ps.player_id = p.id
WHERE ps.score > 5
GROUP BY p.name, ps.score
ORDER BY ps.score DESC;

-- אם הכל טוב:
COMMIT;  -- שמור את השינויים
-- או:
ROLLBACK;  -- בטל את השינויים
```

### עדכון רק Sessions שנסיימו (ended_at IS NOT NULL):
```sql
UPDATE player_sessions
SET score = 5
WHERE score > 5
AND ended_at IS NOT NULL  -- רק Sessions שנסיימו
AND player_id != (
    SELECT id FROM players WHERE name = 'טומי'
);
```

### עדכון עם ערך מותאם אישית (לא תמיד 5):
```sql
-- עדכן כל Session לפי ציון מסוים (למשל, רק Sessions עם score > 10):
UPDATE player_sessions
SET score = 5
WHERE score > 10  -- רק Sessions עם score מעל 10
AND player_id != (
    SELECT id FROM players WHERE name = 'טומי'
);
```

