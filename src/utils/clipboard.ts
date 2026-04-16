import { execSync } from 'child_process';
import * as os from 'os';

export function copyToClipboard(text: string): void {
    const platform = os.platform();
    const release = os.release().toLowerCase();

    try {
        if (platform === 'win32' || (platform === 'linux' && release.includes('microsoft'))) {
            // La cruda verità: clip.exe ha bisogno della firma BOM per rispettare l'Unicode.
            // 1. Creiamo il BOM (Byte Order Mark) per l'UTF-16 Little Endian
            const bom = Buffer.from([0xFF, 0xFE]);

            // 2. Convertiamo il nostro testo pulito in UTF-16LE
            const utf16leText = Buffer.from(text, 'utf16le');

            // 3. Uniamo la firma e il testo in un unico payload corazzato
            const payload = Buffer.concat([bom, utf16leText]);

            // 4. Lo spariamo direttamente in clip.exe. Zero PowerShell, zero latenza.
            execSync('clip.exe', { input: payload });
        } else if (platform === 'darwin') {
            execSync('pbcopy', { input: text });
        } else {
            execSync('xclip -selection clipboard', { input: text });
        }
        console.log('\n✅ Output copiato negli appunti con successo!');
    } catch (error) {
        console.error('\n❌ Impossibile copiare negli appunti. Il sistema manca dei binari nativi.');
    }
}