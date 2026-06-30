const PHRASES = [
  "Hoy es un buen día para empezar.",
  "Pequeños pasos, grandes cambios.",
  "La constancia vence al talento.",
  "Un día a la vez, sin excusas.",
  "Tu yo de mañana te lo agradecerá.",
  "Lo que haces hoy define quién serás.",
  "No rompas la cadena.",
  "El progreso, no la perfección.",
  "Hazlo por la versión que quieres ser.",
  "Disciplina es libertad.",
  "Cada marca cuenta.",
  "Empieza donde estás, usa lo que tienes.",
  "La motivación arranca, el hábito sostiene.",
  "Hoy también cuenta.",
  "Sé constante, no intenso.",
  "Suma un día más a tu racha.",
  "Lo difícil de hoy es la fuerza de mañana.",
  "Repite hasta que sea quien eres.",
  "El esfuerzo de hoy es la calma de mañana.",
  "Vas mejor de lo que crees.",
  "Tú contra ayer. Nadie más.",
  "Aparecer ya es ganar la mitad.",
  "Tu racha es tu historia. Síguela.",
  "Lento es suave, suave es rápido.",
  "Confía en el proceso, repite el día.",
  "Hazlo pequeño, hazlo siempre.",
  "Tu futuro se construye en lo cotidiano.",
  "Un hábito hoy, una identidad mañana.",
  "No cuentes los días, haz que cuenten.",
  "La mejor versión de ti se entrena a diario.",
  "Sigue. Aunque sea poco, sigue.",
];

/** Frase determinística según el día del año — cambia cada día */
export const dailyPhrase = (d: Date = new Date()): string => {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return PHRASES[dayOfYear % PHRASES.length];
};
