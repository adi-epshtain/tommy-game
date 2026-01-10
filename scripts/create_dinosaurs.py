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

# רשימת דינוזאורים עם תמונות (משתמש בתמונות קיימות או דמויות)
DINOSAURS = [
    {"name": "דינו ירוק", "image_path": "/static/dino.png", "description": "דינוזאור ירוק קלאסי", "rarity": "common"},
    {"name": "דינו כחול", "image_path": "/static/dino_1.png", "description": "דינוזאור כחול שמאלי", "rarity": "common"},
    {"name": "דינו אדום", "image_path": "/static/dino_2.png", "description": "דינוזאור אדום ימני", "rarity": "common"},
    {"name": "דינו צהוב", "image_path": "/static/dino.png", "description": "דינוזאור צהוב חמוד", "rarity": "rare"},
    {"name": "דינו סגול", "image_path": "/static/dino_1.png", "description": "דינוזאור סגול מיוחד", "rarity": "rare"},
    {"name": "דינו כתום", "image_path": "/static/dino_2.png", "description": "דינוזאור כתום בוהק", "rarity": "rare"},
    {"name": "דינו זהב", "image_path": "/static/dino.png", "description": "דינוזאור זהב יוקרתי", "rarity": "epic"},
    {"name": "דינו כסף", "image_path": "/static/dino_1.png", "description": "דינוזאור כסף אלגנטי", "rarity": "epic"},
    {"name": "דינו יהלום", "image_path": "/static/dino_2.png", "description": "דינוזאור יהלום נדיר", "rarity": "legendary"},
    {"name": "דינו מלכותי", "image_path": "/static/dino.png", "description": "דינוזאור מלכותי מיוחד", "rarity": "legendary"},
]

def create_dinosaurs():
    """
    יוצר דינוזאורים ראשוניים ב-DB.
    """
    db: Session = SessionLocal()
    
    try:
        created_count = 0
        for dino_data in DINOSAURS:
            # בדוק אם הדינוזאור כבר קיים
            existing = db.query(Dinosaur).filter(Dinosaur.name == dino_data["name"]).first()
            if existing:
                log.info(f"דינוזאור '{dino_data['name']}' כבר קיים, מדלג...")
                continue
            
            # צור דינוזאור חדש
            dinosaur = Dinosaur(
                name=dino_data["name"],
                image_path=dino_data["image_path"],
                description=dino_data["description"],
                rarity=dino_data["rarity"]
            )
            db.add(dinosaur)
            created_count += 1
            log.info(f"נוצר דינוזאור: {dino_data['name']} ({dino_data['rarity']})")
        
        db.commit()
        log.info(f"נוצרו {created_count} דינוזאורים חדשים!")
        
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

