/* Aceptación explícita de la versión que el cliente está viendo. */
window.Aceptacion = {
  mount(data) {
    const d=data.doc;
    if(data.demo || d.tipo!=='proforma' || !d.version) return;
    const box=document.createElement('section');
    box.className='acceptance no-print';
    document.getElementById('v-root').append(box);
    const confirmation = accepted => {
      box.replaceChildren();
      const heading=document.createElement('h2'); heading.textContent='Proforma aceptada';
      const detail=document.createElement('p');
      detail.textContent=`Registrada a nombre de ${accepted.nombre} el ${new Date(accepted.fecha).toLocaleString('es-CR',{timeZone:'America/Costa_Rica'})}. Atlantek coordinará la instalación con usted.`;
      const link=document.createElement('a'); link.className='vbtn vbtn--wa'; link.textContent='Coordinar instalación por WhatsApp';
      link.href='https://wa.me/50672312225?text='+encodeURIComponent(`Hola Atlantek, acepté la proforma ${d.cotizacion||d.numero}. Quiero coordinar la instalación.`);
      link.target='_blank'; link.rel='noopener';
      box.append(heading,detail,link);
    };
    if(d.aceptacion) {confirmation(d.aceptacion);return;}
    if(d.estado!=='enviada') {box.remove();return;}
    box.innerHTML='<h2>Aceptar esta proforma</h2><p>Revise los equipos, importes y condiciones antes de confirmar. La aceptación queda asociada a esta versión; la fecha de instalación se coordina con Atlantek.</p><form><label>Nombre de quien acepta<input name="nombre" required minlength="2" maxlength="150" autocomplete="name"></label><label class="acceptance-check"><input name="consentimiento" type="checkbox" required> He revisado y acepto los equipos, importes y condiciones de esta proforma.</label><button class="vbtn" type="submit">Aceptar proforma</button><p role="status" aria-live="polite"></p></form>';
    const form=box.querySelector('form');
    form.onsubmit=async event=>{
      event.preventDefault(); const button=form.querySelector('button'), status=form.querySelector('[role=status]');
      button.disabled=true; status.textContent='Registrando aceptación…';
      const q=new URLSearchParams(location.search);
      try {
        const response=await fetch(CONFIG.PROFORMA_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},signal:AbortSignal.timeout(20000),body:JSON.stringify({action:'doc-aceptar',numero:d.numero,clave:q.get('k'),version:d.version,nombre:form.elements.nombre.value.trim(),consentimiento:form.elements.consentimiento.checked})});
        const out=await response.json();
        if(!response.ok||!out.ok) throw new Error(out.error||'No se pudo confirmar la aceptación');
        confirmation(out.data);
      } catch(error) {status.textContent='No se confirmó la aceptación. '+error.message;button.disabled=false;}
    };
  }
};
