import { useEffect } from 'react';
import { Account } from '@/types/domain.types';

/**
 * When exactly one account exists and nothing is selected yet, select it.
 * Does not override an intentional "All Accounts" choice after the user clears
 * unless `forceWhenSingle` is true (used after Clear Filters).
 */
export const useAutoSelectSingleAccount = (
  accounts: Account[],
  selectedAccountId: string,
  setSelectedAccountId: (id: string) => void,
  options?: { enabled?: boolean }
) => {
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;
    if (accounts.length === 1 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId, enabled]);
};

export const getSingleAccountId = (accounts: Account[]): string => {
  return accounts.length === 1 ? accounts[0].id : '';
};
