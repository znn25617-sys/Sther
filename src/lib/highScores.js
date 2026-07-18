// highScores.js - نظام لوحة الصدارة المحلي الخالص للأندرويد (Offline Native Storage)
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'aetheria_high_scores';
const LIMIT = 10;

// دالة جلب أعلى الاسكورات المخزنة داخل ذاكرة الأندرويد
export async function fetchTopScores(limit = LIMIT) {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    
    if (value) {
      return JSON.parse(value).slice(0, limit);
    }
    
    // أسماء افتراضية جميلة تظهر للاعب إذا كانت اللعبة تُفتح لأول مرة
    const defaultScores = [
      { player_name: "Iris", score: 500, created_at: new Date().toISOString() },
      { player_name: "Aether", score: 300, created_at: new Date().toISOString() },
      { player_name: "Explorer", score: 120, created_at: new Date().toISOString() }
    ];
    
    // حفظ القائمة الافتراضية فوراً لتسريع المرات القادمة
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(defaultScores) });
    return defaultScores.slice(0, limit);

  } catch (error) {
    console.error('فشل جلب الاسكورات من ذاكرة الهاتف:', error.message);
    return []; // إرجاع مصفوفة فارغة كصمام أمان لمنع تجمد شاشة التحميل
  }
}

// دالة تسجيل وإدخال سكور جديد وترتيب القائمة تلقائياً
export async function submitScore(playerName, score) {
  try {
    const name = (playerName || 'Aether').trim().slice(0, 16) || 'Aether';
    const currentScores = await fetchTopScores(100); // جلب كل الاسكورات المسجلة حالياً
    
    // بناء سطر السكور الجديد
    const newRow = {
      player_name: name,
      score: parseInt(score) || 0,
      created_at: new Date().toISOString()
    };

    // إضافة السكور الجديد وترتيب القائمة من الأعلى للأقل، وفي حال التساوي الأحدث أولاً
    const updatedScores = [...currentScores, newRow]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.created_at) - new Date(a.created_at);
      })
      .slice(0, 20); // الاحتفاظ بأفضل 20 سكور فقط داخل الهاتف لضمان خفة حجم الملف

    // حفظ القائمة الجديدة في ذاكرة الأندرويد الأصلية
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(updatedScores)
    });

    return newRow;

  } catch (error) {
    console.error('فشل حفظ السكور محلياً في الأندرويد:', error.message);
    return null;
  }
}
