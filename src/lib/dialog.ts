export type DialogTone = 'default' | 'danger' | 'warning';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
};

export type AlertOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  tone?: DialogTone;
};

type ConfirmRequest = ConfirmOptions & {
  mode: 'confirm';
  resolve: (value: boolean) => void;
};

type AlertRequest = AlertOptions & {
  mode: 'alert';
  resolve: () => void;
};

export type DialogRequest = ConfirmRequest | AlertRequest;

type Listener = (request: DialogRequest | null) => void;

let listener: Listener | null = null;
let queue: DialogRequest[] = [];
let current: DialogRequest | null = null;

function publish() {
  listener?.(current);
}

function dequeueNext() {
  current = queue.shift() ?? null;
  publish();
}

export function setDialogListener(next: Listener | null) {
  listener = next;
  publish();
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const request: ConfirmRequest = {
      mode: 'confirm',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      ...options,
      resolve,
    };
    if (!current) {
      current = request;
      publish();
    } else {
      queue.push(request);
    }
  });
}

export function alertDialog(options: AlertOptions | string): Promise<void> {
  const normalized: AlertOptions =
    typeof options === 'string' ? { message: options } : options;

  return new Promise((resolve) => {
    const request: AlertRequest = {
      mode: 'alert',
      title: 'Aviso',
      confirmLabel: 'Entendido',
      tone: 'default',
      ...normalized,
      resolve,
    };
    if (!current) {
      current = request;
      publish();
    } else {
      queue.push(request);
    }
  });
}

export function resolveDialog(value: boolean) {
  if (!current) return;
  if (current.mode === 'confirm') {
    current.resolve(value);
  } else {
    current.resolve();
  }
  dequeueNext();
}
