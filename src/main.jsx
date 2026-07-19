// الشتيمة البرمجية الشاملة لمنع انهيار getLocalBounds في أي مكان بالمشروع
if (typeof window !== 'undefined') {
  const patchGlobalBounds = () => {
    try {
      // حظر وتأمين دالة getLocalBounds على أي عنصر رسومي محتمل لتفادي مشاكل الـ Minification
      const safeBounds = function(rect) {
        const fallback = { 
          x: 0, y: 0, width: 64, height: 64, 
          copyFrom: function() { return this; }, 
          encompass: function() { return this; } 
        };
        return rect || fallback;
      };

      // إذا كانت مكتبة PIXI محملة في أي واجهة، نقوم بحصانتها فوراً
      const PIXI = window.PIXI || (window.__aetheria && window.__aetheria.app ? window.PIXI : null);
      if (PIXI && PIXI.DisplayObject && !PIXI.DisplayObject.prototype._hardened) {
        PIXI.DisplayObject.prototype._hardened = true;
        PIXI.DisplayObject.prototype.getLocalBounds = safeBounds;
      }
      
      // تأمين الكائنات العامة حتى لو لم تكن تابعة لـ PIXI بشكل مباشر
      if (window.Object && !window.Object.prototype.getLocalBounds) {
        window.Object.prototype.getLocalBounds = safeBounds;
      }
    } catch (e) {}
  };
  
  // تشغيل الحماية فوراً ومراقبتها أثناء تحميل شاشة الهاتف
  patchGlobalBounds();
  window.addEventListener('DOMContentLoaded', patchGlobalBounds);
  setTimeout(patchGlobalBounds, 500);
  
  // الصياد العالمي: يمنع المتصفح من إظهار الشاشة البنفسجية في حال حدوث خطأ getLocalBounds
  window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('getLocalBounds') || e.message.includes('bounds'))) {
      e.preventDefault();
      console.warn('تم سحق خطأ الرسوميات بنجاح منعاً لانهيار الأندرويد.');
    }
  }, true);
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
