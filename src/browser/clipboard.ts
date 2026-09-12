export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* Fall back for embedded browsers without Clipboard API access. */ }
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.position = 'fixed';
  field.style.top = '-1000px';
  document.body.appendChild(field);
  field.select();
  try { return document.execCommand('copy'); }
  catch { return false; }
  finally { field.remove(); }
}
