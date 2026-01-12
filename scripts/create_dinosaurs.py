#!/usr/bin/env python3
"""
Script ליצירת דינוזאורים ראשוניים ב-DB.
"""

import sys
import os

# הוסף את התיקייה הראשית ל-path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from infra.database import SessionLocal
from models import Dinosaur
from infra.logger import log

# רשימת דינוזאורים עם תמונות dino_1 עד dino_10
# חלוקה ל-5 רמות: 2 דינוזאורים לכל רמה
DINOSAURS = [
    {"name": "דינו חוקר", "image_path": "/static/dino_1.png", "description": "סקרן, מגלה, לומד", "level": "1"},
    {"name": "דינו מהיר", "image_path": "/static/dino_2.png", "description": "זריז, חד, תגובתי", "level": "1"},
    {"name": "דינו תייר", "image_path": "/static/dino_11.png", "description": "נוסע, מגלה, סקרן", "level": "1"},
    {"name": "דינו טייס", "image_path": "/static/dino_3.png", "description": "הרפתקן, חופשי, נועז", "level": "2"},
    {"name": "דינו לוחם", "image_path": "/static/dino_4.png", "description": "חזק, נחוש, מגן", "level": "2"},
    {"name": "דינו חייכן", "image_path": "/static/dino_12.png", "description": "שמח, עליז, אופטימי", "level": "2"},
    {"name": "דינו חכם", "image_path": "/static/dino_5.png", "description": "חושב, מנתח, פותר", "level": "3"},
    {"name": "דינו אמיץ", "image_path": "/static/dino_6.png", "description": "fearless, בטוח, יוזם", "level": "3"},
    {"name": "דינו נדיר", "image_path": "/static/dino_13.png", "description": "מיוחד, ייחודי, נדיר", "level": "3"},
    {"name": "דינו רץ", "image_path": "/static/dino_7.png", "description": "תחרותי, אנרגטי, מתמיד", "level": "4"},
    {"name": "דינו כוכב", "image_path": "/static/dino_8.png", "description": "בולט, בטוח, מוביל", "level": "4"},
    {"name": "דינו מנצח", "image_path": "/static/dino_14.png", "description": "מנצח, מצליח, מעולה", "level": "4"},
    {"name": "דינו אסטרונאוט", "image_path": "/static/dino_9.png", "description": "חולם, סקרן, מגלה", "level": "5"},
    {"name": "דינו גיבור", "image_path": "/static/dino_10.png", "description": "עוזר, מוביל, מציל", "level": "5"},
    {"name": "דינו על", "image_path": "/static/dino_15.png", "description": "עליון, מעולה, מושלם", "level": "5"},
]

def create_dinosaurs():
    """
    יוצר דינוזאורים ראשוניים ב-DB.
    """
    db: Session = SessionLocal()
    
    try:
        created_count = 0
        updated_count = 0
        for dino_data in DINOSAURS:
            # בדוק אם הדינוזאור כבר קיים
            existing = db.query(Dinosaur).filter(Dinosaur.name == dino_data["name"]).first()
            if existing:
                # עדכן נתיב תמונה ותיאור אם השתנו
                updated = False
                if existing.image_path != dino_data["image_path"]:
                    existing.image_path = dino_data["image_path"]
                    updated = True
                if existing.description != dino_data["description"]:
                    existing.description = dino_data["description"]
                    updated = True
                if existing.level != dino_data["level"]:
                    existing.level = dino_data["level"]
                    updated = True
                if updated:
                    updated_count += 1
                    log.info(f"עודכן דינוזאור: {dino_data['name']} (image_path: {dino_data['image_path']})")
                else:
                    log.info(f"דינוזאור '{dino_data['name']}' כבר קיים ועדכני")
                continue
            
            # צור דינוזאור חדש
            dinosaur = Dinosaur(
                name=dino_data["name"],
                image_path=dino_data["image_path"],
                description=dino_data["description"],
                level=dino_data["level"]
            )
            db.add(dinosaur)
            created_count += 1
            log.info(f"נוצר דינוזאור: {dino_data['name']} (רמה {dino_data['level']})")
        
        db.commit()
        log.info(f"נוצרו {created_count} דינוזאורים חדשים!")
        if updated_count > 0:
            log.info(f"עודכנו {updated_count} דינוזאורים קיימים!")
        
        # הצג סיכום
        total = db.query(Dinosaur).count()
        log.info(f"סה\"כ דינוזאורים ב-DB: {total}")
        
    except Exception as e:
        db.rollback()
        log.error(f"שגיאה ביצירת דינוזאורים: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    log.info("מתחיל יצירת דינוזאורים...")
    try:
        create_dinosaurs()
        log.info("יצירת דינוזאורים הושלמה בהצלחה!")
    except Exception as e:
        log.error(f"יצירת דינוזאורים נכשלה: {e}")
        sys.exit(1)

