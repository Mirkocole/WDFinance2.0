import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase (usiamo le variabili server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'UserID richiesto' }, { status: 400 });
    }

    // Tenta di caricare le impostazioni dal DB
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('userId', userId)
      .single();

    const emailUser = settings?.emailUser || process.env.EMAIL_USER;
    const emailPass = settings?.emailPass || process.env.EMAIL_PASS;
    const emailHost = settings?.emailHost || process.env.EMAIL_HOST || 'imap.gmail.com';
    const emailPort = settings?.emailPort || parseInt(process.env.EMAIL_PORT || '993');

    if (!emailUser || !emailPass) {
      return NextResponse.json({ error: 'Configurazione email mancante. Vai in Impostazioni.' }, { status: 400 });
    }

    const client = new ImapFlow({
      host: emailHost,
      port: emailPort,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    const expensesAdded = [];

    try {
      // Cerchiamo email degli ultimi 7 giorni per sicurezza
      const searchCriteria = {
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };

      for await (const message of client.list(searchCriteria, { source: true })) {
        const parsed = await simpleParser(message.source);
        const subject = parsed.subject || '';
        const body = parsed.text || '';
        const date = parsed.date || new Date();
        const messageId = parsed.messageId || `msg-${date.getTime()}`;

        let expenseData = null;

        // --- REGOLE DI PARSING SPECIFICHE ---

        // 1. REVOLUT (Ottimizzato)
        if (body.includes('Revolut') || subject.includes('Revolut')) {
          // Esempio: "Hai speso 12,50 € presso Starbucks" o "You spent 12,50 € at Starbucks"
          const match = body.match(/(?:speso|spent|paid|pagato) ([\d,.]+) ?(?:€|EUR) (?:presso|at|to) (.*)/i);
          if (match) {
            expenseData = {
              name: match[2].split('\n')[0].trim(), // Prendi solo la prima riga se l'esercente è seguito da a capo
              amount: parseFloat(match[1].replace(',', '.')),
              category: 'other',
              type: 'sporadic',
              date: date.toISOString().split('T')[0],
              note: 'Sincronizzato da Revolut',
              externalId: messageId,
            };
          }
        }

        // 2. INTESA SANPAOLO
        else if (body.includes('Intesa Sanpaolo') || subject.includes('Intesa Sanpaolo')) {
          // Esempio: "Operazione effettuata... Importo: 15,00 EUR... Esercente: Amazon"
          const amountMatch = body.match(/Importo:? ([\d,.]+) ?(?:EUR|€)/i);
          const merchantMatch = body.match(/Esercente:? (.*)/i) || body.match(/presso (.*)/i);
          
          if (amountMatch) {
            expenseData = {
              name: merchantMatch ? merchantMatch[1].trim() : 'Spesa Intesa Sanpaolo',
              amount: parseFloat(amountMatch[1].replace(',', '.')),
              category: 'other',
              type: 'sporadic',
              date: date.toISOString().split('T')[0],
              note: 'Sincronizzato da Intesa Sanpaolo',
              externalId: messageId,
            };
          }
        }

        // 3. GENERICO (Cerca un importo in euro)
        else {
          const euroMatch = body.match(/([\d,.]+) ?(?:€|EUR)/);
          if (euroMatch) {
            const amount = parseFloat(euroMatch[1].replace(',', '.'));
            if (amount > 0 && amount < 10000) { // Filtro per evitare falsi positivi (es. numeri di telefono)
              expenseData = {
                name: subject.substring(0, 50) || 'Spesa da Email',
                amount: amount,
                category: 'other',
                type: 'sporadic',
                date: date.toISOString().split('T')[0],
                note: `Auto-rilevato da: ${subject}`,
                externalId: messageId,
              };
            }
          }
        }

        // Salva su Supabase se abbiamo dati validi
        if (expenseData) {
          // Tenta di identificare il metodo di pagamento per aggiornare il saldo
          let targetBankName = '';
          if (body.includes('Revolut') || subject.includes('Revolut')) targetBankName = 'Revolut';
          else if (body.includes('Intesa Sanpaolo') || subject.includes('Intesa Sanpaolo')) targetBankName = 'Intesa';

          const { data: pMethods } = await supabase
            .from('payment_methods')
            .select('id, balance, name')
            .eq('userId', userId);
          
          const matchedMethod = pMethods?.find(m => 
            m.name.toLowerCase().includes(targetBankName.toLowerCase())
          );

          if (matchedMethod) {
            expenseData.paymentMethodId = matchedMethod.id;
          }

          const { error: insertError } = await supabase
            .from('expenses')
            .insert([{ ...expenseData, userId }]);
          
          if (!insertError) {
            expensesAdded.push(expenseData);

            // Aggiorna il saldo della carta se trovata
            if (matchedMethod) {
              await supabase
                .from('payment_methods')
                .update({ balance: matchedMethod.balance - expenseData.amount })
                .eq('id', matchedMethod.id);
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return NextResponse.json({ 
      success: true, 
      count: expensesAdded.length,
      items: expensesAdded 
    });

  } catch (error: any) {
    console.error('Email Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
