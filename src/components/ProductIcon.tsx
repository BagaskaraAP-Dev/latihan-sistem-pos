import React from 'react';

interface ProductIconProps {
  name: string;
  category?: string;
  icon?: string;
  className?: string;
}

export default function ProductIcon({ name, category, icon, className = 'w-16 h-16' }: ProductIconProps) {
  const n = (name + ' ' + (icon || '')).toLowerCase();

  // 1. Beras (Rice Sack)
  if (n.includes('beras') || n.includes('rice')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M25 35 Q20 85 28 90 Q50 92 72 90 Q80 85 75 35 Q50 30 25 35 Z" fill="#E2D9C8" stroke="#8D7B68" strokeWidth="2.5" />
        <path d="M28 36 Q50 42 72 36 Q70 28 50 28 Q30 28 28 36 Z" fill="#D0C4B0" stroke="#8D7B68" strokeWidth="2.5" />
        <rect x="35" y="48" width="30" height="32" rx="3" fill="#609966" />
        {/* Rice stalk motif */}
        <path d="M50 74 Q50 54 42 52 M50 68 Q50 54 58 52 M50 62 Q50 50 44 48 M50 56 Q50 46 56 46" stroke="#EDF1D6" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="50" cy="50" rx="2" ry="3.5" fill="#F7FFE5" transform="rotate(-20 50 50)" />
        <ellipse cx="44" cy="54" rx="2" ry="3.5" fill="#F7FFE5" transform="rotate(-35 44 54)" />
        <ellipse cx="56" cy="54" rx="2" ry="3.5" fill="#F7FFE5" transform="rotate(35 56 54)" />
      </svg>
    );
  }

  // 2. Minyak Goreng (Yellow Cooking Oil Jerrycan / Pouch)
  if (n.includes('minyak') || n.includes('oil') || n.includes('sania')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Cap */}
        <rect x="42" y="14" width="16" height="8" rx="2" fill="#2563EB" stroke="#1E40AF" strokeWidth="2" />
        {/* Handle */}
        <path d="M36 28 C36 20 64 20 64 28" stroke="#F59E0B" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Body */}
        <rect x="30" y="26" width="40" height="64" rx="8" fill="#FDE047" stroke="#D97706" strokeWidth="2.5" />
        {/* Label */}
        <rect x="35" y="44" width="30" height="28" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
        <ellipse cx="50" cy="56" rx="10" ry="6" fill="#FBBF24" />
        <path d="M44 56 Q50 52 56 56" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // 3. Gula Pasir (Sugar Bag)
  if (n.includes('gula') || n.includes('sugar') || n.includes('gulaku')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M28 22 L72 22 L76 86 C76 89 74 91 71 91 L29 91 C26 91 24 89 24 86 Z" fill="#2E7D32" stroke="#1B5E20" strokeWidth="2.5" />
        {/* Top fold */}
        <path d="M24 22 L50 26 L76 22 L74 18 L26 18 Z" fill="#1B5E20" />
        {/* White sugar graphic */}
        <rect x="34" y="40" width="32" height="34" rx="4" fill="#FFFFFF" opacity="0.9" />
        <circle cx="50" cy="55" r="9" fill="#E8F5E9" />
        <path d="M46 55 L50 51 L54 55 L50 59 Z" fill="#2E7D32" />
      </svg>
    );
  }

  // 4. Telur Ayam (Egg Carton Tray)
  if (n.includes('telur') || n.includes('egg')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Eggs behind */}
        <ellipse cx="36" cy="46" rx="9" ry="13" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <ellipse cx="50" cy="44" rx="9" ry="13" fill="#F59E0B" stroke="#92400E" strokeWidth="1.5" />
        <ellipse cx="64" cy="46" rx="9" ry="13" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        {/* Eggs front */}
        <ellipse cx="43" cy="58" rx="9" ry="13" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
        <ellipse cx="57" cy="58" rx="9" ry="13" fill="#F59E0B" stroke="#92400E" strokeWidth="1.5" />
        {/* Egg tray carton */}
        <path d="M22 66 Q20 86 28 88 L72 88 Q80 86 78 66 Q72 72 64 68 Q56 72 50 68 Q44 72 36 68 Q28 72 22 66 Z" fill="#B45309" stroke="#78350F" strokeWidth="2" />
      </svg>
    );
  }

  // 5. Indomie / Mie Instan
  if (n.includes('indomie') || n.includes('mie') || n.includes('noodle')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect x="22" y="30" width="56" height="50" rx="6" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
        {/* Red and Green banner */}
        <path d="M22 35 L78 35 L78 48 L22 48 Z" fill="#DC2626" />
        <path d="M22 48 L78 48 L78 54 L22 54 Z" fill="#16A34A" />
        {/* Cooked noodles illustration */}
        <ellipse cx="50" cy="67" rx="14" ry="8" fill="#451A03" />
        <ellipse cx="50" cy="66" rx="12" ry="6" fill="#FEF08A" />
        <circle cx="50" cy="65" r="3" fill="#DC2626" />
      </svg>
    );
  }

  // 6. Kopi (Coffee Bag / Sachet)
  if (n.includes('kopi') || n.includes('coffee') || n.includes('kapal api')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect x="26" y="24" width="48" height="64" rx="5" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
        <rect x="32" y="38" width="36" height="38" rx="3" fill="#78350F" />
        {/* Steaming cup */}
        <path d="M42 58 Q42 66 50 66 Q58 66 58 58 Z" fill="#FFFFFF" />
        <path d="M58 60 Q62 60 62 63 Q62 66 58 66" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <path d="M46 52 Q47 48 46 45 M50 52 Q51 48 50 45 M54 52 Q55 48 54 45" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Teh Botol Sosro (Glass Bottle with Red Cap)
  if (n.includes('teh') || n.includes('tea') || n.includes('sosro') || n.includes('botol')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Red Crown Cap */}
        <rect x="44" y="14" width="12" height="6" rx="1" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
        {/* Neck */}
        <rect x="46" y="20" width="8" height="18" fill="#F87171" opacity="0.8" stroke="#B91C1C" strokeWidth="1.5" />
        {/* Body */}
        <path d="M46 38 L36 50 L36 86 C36 89 38 91 42 91 L58 91 C62 91 64 89 64 86 L64 50 L54 38 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="2.5" />
        {/* Amber liquid fill */}
        <rect x="38" y="56" width="24" height="28" rx="2" fill="#78350F" opacity="0.6" />
        {/* Red Sosro stripe */}
        <rect x="36" y="62" width="28" height="12" fill="#DC2626" />
        <rect x="42" y="66" width="16" height="4" fill="#FFFFFF" />
      </svg>
    );
  }

  // 8. Susu Ultra Milk (Blue Milk Carton)
  if (n.includes('susu') || n.includes('milk') || n.includes('ultra')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Gable Top */}
        <path d="M32 30 L50 16 L68 30 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
        <rect x="48" y="14" width="4" height="4" fill="#0369A1" />
        {/* Carton Body */}
        <rect x="32" y="30" width="36" height="60" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="2.5" />
        {/* White milk wave */}
        <path d="M32 58 Q40 50 50 58 Q60 66 68 58 L68 90 L32 90 Z" fill="#FFFFFF" />
        {/* Cow patch */}
        <circle cx="48" cy="74" r="5" fill="#0F172A" />
        <circle cx="56" cy="78" r="3.5" fill="#0F172A" />
        <rect x="40" y="38" width="20" height="7" rx="1.5" fill="#FFFFFF" />
        <rect x="42" y="40" width="16" height="3" fill="#0369A1" />
      </svg>
    );
  }

  // 9. Sabun Cuci Piring (Green Dish Soap Bottle with Pump/Cap)
  if (n.includes('sabun cuci') || n.includes('sunlight') || n.includes('piring')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Dispenser Pump / Cap */}
        <rect x="47" y="14" width="6" height="12" fill="#15803D" />
        <path d="M43 14 L57 14 L62 18 L38 18 Z" fill="#166534" />
        {/* Bottle Body */}
        <path d="M44 26 C36 30 30 45 30 65 C30 84 37 90 50 90 C63 90 70 84 70 65 C70 45 64 30 56 26 Z" fill="#84CC16" stroke="#4D7C0F" strokeWidth="2.5" />
        {/* Yellow Lime Logo */}
        <circle cx="50" cy="62" r="10" fill="#FACC15" />
        <path d="M50 52 Q58 62 50 72 Q42 62 50 52 Z" fill="#A3E635" />
      </svg>
    );
  }

  // 10. Sabun Mandi (Lifebuoy Soap Bar)
  if (n.includes('mandi') || n.includes('lifebuoy') || n.includes('soap')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect x="24" y="32" width="52" height="42" rx="12" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.5" />
        <ellipse cx="50" cy="53" rx="18" ry="12" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="47" y="45" width="6" height="16" rx="1" fill="#FFFFFF" />
        <rect x="42" y="50" width="16" height="6" rx="1" fill="#FFFFFF" />
      </svg>
    );
  }

  // 11. Deterjen (Rinso Detergent Pouch)
  if (n.includes('deterjen') || n.includes('rinso') || n.includes('cuci baju')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M30 24 L70 24 L76 86 C76 89 73 91 70 91 L30 91 C27 91 24 89 24 86 Z" fill="#047857" stroke="#065F46" strokeWidth="2.5" />
        {/* Colorful burst */}
        <circle cx="50" cy="58" r="16" fill="#F59E0B" />
        <circle cx="50" cy="58" r="11" fill="#3B82F6" />
        <circle cx="50" cy="58" r="6" fill="#FFFFFF" />
      </svg>
    );
  }

  // 12. Air Mineral Aqua (Water Bottle)
  if (n.includes('air') || n.includes('aqua') || n.includes('mineral') || n.includes('water')) {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        {/* Blue Cap */}
        <rect x="44" y="14" width="12" height="7" rx="1.5" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5" />
        {/* Bottle Neck */}
        <rect x="46" y="21" width="8" height="10" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        {/* Bottle Body */}
        <path d="M46 31 L38 42 L38 86 C38 89 40 91 44 91 L56 91 C60 91 62 89 62 86 L62 42 L54 31 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" />
        {/* Aqua blue label */}
        <rect x="38" y="54" width="24" height="18" fill="#0284C7" />
        {/* Mountain wave on label */}
        <path d="M38 64 L46 58 L52 63 L62 55 L62 72 L38 72 Z" fill="#38BDF8" />
      </svg>
    );
  }

  // Generic Default Package
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <rect x="28" y="26" width="44" height="56" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />
      <path d="M28 44 L72 44" stroke="#CBD5E1" strokeWidth="2" />
      <circle cx="50" cy="62" r="8" fill="#3B82F6" opacity="0.6" />
    </svg>
  );
}
