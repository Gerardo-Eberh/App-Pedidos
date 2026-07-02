import { Product } from '../types';

export const PRESEEDED_PRODUCTS: Product[] = [
  // IT & Equipamiento Tecnológico
  { code: "TEC-LPT-001", description: "Laptop Ejecutiva Core i7 16GB RAM 512GB SSD", uom: "UN", source: "default" },
  { code: "TEC-MON-024", description: "Monitor Profesional 24 pulgadas IPS Full HD", uom: "UN", source: "default" },
  { code: "TEC-KEY-102", description: "Teclado Mecánico Inalámbrico Ergonómico Español", uom: "UN", source: "default" },
  { code: "TEC-MOU-050", description: "Mouse Óptico Recargable Conexión Dual Bluetooth", uom: "UN", source: "default" },
  { code: "TEC-SWI-024", description: "Switch de Red Administrable de 24 Puertos Gigabit", uom: "UN", source: "default" },
  { code: "TEC-SRV-401", description: "Servidor en Rack Xeon 32-Core 128GB RAM 2TB SAS", uom: "UN", source: "default" },
  { code: "TEC-DSK-002", description: "Disco Duro Externo Alta Resistencia 2TB USB 3.2", uom: "UN", source: "default" },
  { code: "TEC-UPS-150", description: "Sistema de Respaldo Eléctrico UPS 1500VA Smart-PRO", uom: "UN", source: "default" },
  { code: "TEC-CAB-CAT6", description: "Bobina de Cable de Red UTP Cat6 Libre de Halógeno 305m", uom: "BOB", source: "default" },
  
  // Seguridad e Higiene Industrial (EPI)
  { code: "SEG-CAS-001", description: "Casco de Seguridad Industrial de Alta Resistencia con Arnés", uom: "UN", source: "default" },
  { code: "SEG-ZAP-D38", description: "Zapatos de Seguridad Industrial con Punta de Acero Talle 38", uom: "PAR", source: "default" },
  { code: "SEG-ZAP-D40", description: "Zapatos de Seguridad Industrial con Punta de Acero Talle 40", uom: "PAR", source: "default" },
  { code: "SEG-ZAP-D42", description: "Zapatos de Seguridad Industrial con Punta de Acero Talle 42", uom: "PAR", source: "default" },
  { code: "SEG-ZAP-D44", description: "Zapatos de Seguridad Industrial con Punta de Acero Talle 44", uom: "PAR", source: "default" },
  { code: "SEG-LEN-CLAR", description: "Lentes de Seguridad de Policarbonato Antiempaño Claros", uom: "UN", source: "default" },
  { code: "SEG-LEN-OSC", description: "Lentes de Seguridad de Policarbonato Antiempaño Oscuros", uom: "UN", source: "default" },
  { code: "SEG-GUA-NTRL", description: "Caja de Guantes de Nitrilo Descartables Talle L 100 un", uom: "CJA", source: "default" },
  { code: "SEG-GUA-CUER", description: "Guantes de Cuero Descarne Reforzado para Soldador 40cm", uom: "PAR", source: "default" },
  { code: "SEG-FAL-REFR", description: "Chaleco Reflectante Vial de Alta Visibilidad Amarillo L", uom: "UN", source: "default" },
  { code: "SEG-EXT-010", description: "Extintor de Incendios de Polvo Químico Seco PQS 10KG", uom: "UN", source: "default" },
  { code: "SEG-BOT-PRIM", description: "Botiquín de Primeros Auxilios de Pared Equipado R20", uom: "UN", source: "default" },
  
  // Librería y Papelería de Oficina
  { code: "OFI-RES-A4", description: "Resma de Papel Blanco Multifunción A4 75g (500 Hojas)", uom: "UN", source: "default" },
  { code: "OFI-RES-OFI", description: "Resma de Papel Blanco Multifunción Oficio 75g (500 Hojas)", uom: "UN", source: "default" },
  { code: "OFI-BOL-NEGR", description: "Bolígrafo de Tinta Gel Retráctil Color Negro (Caja 12u)", uom: "CJA", source: "default" },
  { code: "OFI-BOL-AZUL", description: "Bolígrafo de Tinta Gel Retráctil Color Azul (Caja 12u)", uom: "CJA", source: "default" },
  { code: "OFI-RES-AMAR", description: "Notas Autoadhesivas 76x76mm Color Amarillo Neon", uom: "PAQ", source: "default" },
  { code: "OFI-ABR-METL", description: "Abrochadora de Escritorio Metálica Profesional N24/6", uom: "UN", source: "default" },
  { code: "OFI-SCA-REFI", description: "Sacapuntas Eléctrico de Alta Capacidad para Oficina", uom: "UN", source: "default" },
  { code: "OFI-SMI-246", description: "Caja de Ganchos Abrochadora N24/6 (5000 unidades)", uom: "CJA", source: "default" },
  { code: "OFI-RES-FLUO", description: "Marcador Resaltador Punta Biselada Colores Surtidos", uom: "SET", source: "default" },
  { code: "OFI-ARC-CORR", description: "Bibliorato de Cartón Forrado con Palanca Tamaño Oficio", uom: "UN", source: "default" },

  // Herramientas y Ferretería
  { code: "FER-PIN-UNI", description: "Pinza Universal de Fuerza Con Mangos Aislados 8 pulgadas", uom: "UN", source: "default" },
  { code: "FER-DES-SET", description: "Juego de Destornilladores Planos y Philips Aislar 6u", uom: "SET", source: "default" },
  { code: "FER-TAL-B18", description: "Taladro Percutor Inalámbrico Motor Brushless 18V Li-Ion", uom: "UN", source: "default" },
  { code: "FER-AME-005", description: "Amoladora Angular Profesional 4.5 pulgadas 850W", uom: "UN", source: "default" },
  { code: "FER-MET-005", description: "Cinta Métrica de Acero Retráctil de Alta Resistencia 5m", uom: "UN", source: "default" },
  { code: "FER-NIV-ALU", description: "Nivel de Mano de Aluminio Magnético Profesional 24 pulgadas", uom: "UN", source: "default" },
  { code: "FER-LLA-FRAC", description: "Juego de Llaves Combinadas Cromo Vanadio (8 a 22mm)", uom: "SET", source: "default" },
  { code: "FER-CJA-MET", description: "Caja Portatool de Metal Reforzada 3 Bandejas", uom: "UN", source: "default" },

  // Materiales de Construcción e Insumos Químicos
  { code: "MAT-CEM-050", description: "Bolsa de Cemento Portland Alta Resistencia CP40 50KG", uom: "BOL", source: "default" },
  { code: "MAT-CAL-025", description: "Bolsa de Cal Hidratada Común para Albañilería 25KG", uom: "BOL", source: "default" },
  { code: "MAT-ARE-M3", description: "Arena Limpia Clasificada de Cantera para Hormigón", uom: "M3", source: "default" },
  { code: "MAT-PIE-M3", description: "Piedra Partida Clasificada de Cantera para Hormigón", uom: "M3", source: "default" },
  { code: "MAT-VAR-D08", description: "Varilla de Hierro Nervado para Construcción Diámetro 8mm 12m", uom: "UN", source: "default" },
  { code: "MAT-VAR-D10", description: "Varilla de Hierro Nervado para Construcción Diámetro 10mm 12m", uom: "UN", source: "default" },
  { code: "QUI-TIN-010", description: "Tinta Sintética para Madera Color Cedro Satinado 10 Litros", uom: "BAL", source: "default" },
  { code: "QUI-SOL-005", description: "Solvente Thinner Multiuso de Alta Calidad Bidón 5 Litros", uom: "BID", source: "default" },
  { code: "QUI-PEG-010", description: "Adhesivo Sellador de Poliuretano Multipropósito Cartucho 310ml", uom: "UN", source: "default" },

  // Servicios e Insumos Médicos Básicos
  { code: "MED-MAS-050", description: "Caja de Mascarillas Quirúrgicas Triple Capa Celeste 50u", uom: "CJA", source: "default" },
  { code: "MED-ALC-001", description: "Alcohol Etílico Líquido Sanitizante de Manos 70% 1 Litro", uom: "UN", source: "default" },
  { code: "MED-TERM-D", description: "Termómetro Digital de Lectura Rápida Infrarrojo de Frente", uom: "UN", source: "default" }
];
