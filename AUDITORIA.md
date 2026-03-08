# Auditoría Inicial — GACETA Web

Pegá este prompt en Claude Code al arrancar la sesión de trabajo:

---

## Prompt de Auditoría

```
Leé el archivo CLAUDE.md y todos los archivos en .claude/skills/ para entender el contexto del proyecto.

Luego auditá el proyecto completo y generá un informe estructurado con:

1. **Estructura del proyecto**: Cómo están organizados los archivos y componentes
2. **Stack y dependencias**: Versiones usadas, dependencias innecesarias o desactualizadas
3. **Componentes principales**: Lista de componentes con una línea de descripción de qué hace cada uno
4. **Estado del reproductor**: Cómo está implementado, dónde vive el estado, cómo funciona el shuffle
5. **Animaciones existentes**: Qué animaciones GSAP hay, cómo están organizadas
6. **Performance — problemas detectados**: Imágenes sin optimizar, imports pesados, renders innecesarios
7. **UX — problemas detectados**: Cosas rotas en mobile, interacciones faltantes, flujos confusos
8. **Diseño — oportunidades de mejora**: Sin cambiar la identidad, qué se podría refinar
9. **Prioridades recomendadas**: Top 5 cambios que tendrían mayor impacto

Sé específico: nombrá archivos y líneas cuando sea relevante. No propongas cambios todavía, solo el diagnóstico.
```

---

## Cómo usar este sistema de skills

En Claude Code, cuando necesites trabajar en un área específica, pedile que lea el skill antes:

**Performance:**
```
Leé .claude/skills/performance.md y luego optimizá las imágenes del proyecto
```

**Animaciones:**
```
Leé .claude/skills/animations.md y auditá todas las animaciones GSAP existentes
```

**Diseño:**
```
Leé .claude/skills/design.md y revisá si los botones y la tipografía siguen el sistema
```

**UX:**
```
Leé .claude/skills/ux.md y revisá la experiencia mobile del reproductor
```

---

## Flujo de trabajo recomendado

1. `claude` en la terminal dentro del proyecto
2. Pegá el prompt de auditoría de arriba
3. Revisá el informe y priorizá junto a Claude
4. Trabajá área por área, leyendo el skill correspondiente en cada sesión
5. Hacé commits pequeños y frecuentes para poder revertir si algo se rompe
