(() => {
  const menu = document.getElementById('account-menu');
  const closeMenu = () => { menu.open = false; };
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      closeMenu();
      menu.querySelector('summary').focus();
    }
  });
  const form = document.getElementById('registration-form');
  const status = document.getElementById('registration-status');
  const confirm = form.elements.confirm;
  const checkMatch = () => confirm.setCustomValidity(confirm.value === form.elements.password.value ? '' : 'Las contraseñas no coinciden.');
  confirm.addEventListener('input', checkMatch);
  form.elements.password.addEventListener('input', checkMatch);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    checkMatch();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    button.textContent = 'Creando cuenta…';
    status.className = 'lead-form__status is-ok';
    status.textContent = 'Guardando su cuenta…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('https://admin.atlanteksystems.com/api/auth/client-register', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.elements.nombre.value.trim(), email: form.elements.email.value.trim(), password: form.elements.password.value, consent: form.elements.consent.checked }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo crear la cuenta. Intentelo nuevamente.');
      form.reset();
      status.textContent = 'Cuenta creada. Ya puede entrar al portal con su correo y contraseña.';
    } catch (error) {
      status.className = 'lead-form__status is-error';
      status.textContent = error.name === 'AbortError' || error instanceof TypeError
        ? 'No se pudo confirmar la creación. Pruebe iniciar sesión antes de volver a registrarse.'
        : error.message;
    } finally {
      clearTimeout(timer);
      button.disabled = false;
      button.textContent = 'Crear cuenta';
      status.focus({ preventScroll: true });
    }
  });
})();
