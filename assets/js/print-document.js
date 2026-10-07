/* Esperar recursos evita PDF sin logo/fuentes al imprimir recién guardado. */
window.printDocument = async function (title, button) {
  const previousTitle = document.title;
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparando PDF…';
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(document.querySelectorAll('.sheet img'), img => img.decode()));
    document.title = title;
    const restore = () => {
      document.title = previousTitle;
      button.disabled = false;
      button.textContent = previousText;
    };
    window.addEventListener('afterprint', restore, { once: true });
    window.print();
    // El evento afterprint restaura el título después de guardar el PDF.
    button.disabled = false;
    button.textContent = previousText;
  } catch (error) {
    document.title = previousTitle;
    button.disabled = false;
    button.textContent = previousText;
    alert('No se pudo preparar el PDF completo. Revisá la conexión y volvé a intentar.');
  }
};
