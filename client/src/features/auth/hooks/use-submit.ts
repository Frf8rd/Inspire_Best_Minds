import { useState } from 'react';

import { getErrorMessage } from '@/lib/api-client';

/** Rulează o acțiune async și păstrează mesajul de eroare pentru banner — folosit de toate formularele. */
export function useSubmit() {
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return { error, submit };
}
