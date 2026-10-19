/** Anexo v1.2 E7: enlace wa.me con un texto; no usa ninguna API de WhatsApp. */
export function enlaceWhatsApp(telefono: string, texto: string): string {
  const numero = telefono.replace(/\D/g, '');
  const conPais = numero.startsWith('51') ? numero : `51${numero}`;
  return `https://wa.me/${conPais}?text=${encodeURIComponent(texto)}`;
}
