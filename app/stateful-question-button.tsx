import { Icon } from "./icons";

type StatefulQuestionButtonProps = {
  prompt: string;
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
  href: string;
};

export function StatefulQuestionButton({
  prompt,
  idleLabel,
  loadingLabel,
  successLabel,
  href,
}: StatefulQuestionButtonProps) {
  return (
    <div className="faq-question-action">
      <p>{prompt}</p>
      <button
        className="stateful-button"
        type="button"
        data-stateful-question
        data-state="idle"
        data-href={href}
        data-idle-label={idleLabel}
        data-loading-label={loadingLabel}
        data-success-label={successLabel}
        aria-busy="false"
      >
        <span
          className="stateful-icon stateful-icon-idle"
          aria-hidden="true"
        >
          <Icon name="whatsapp" size={17} />
        </span>
        <span
          className="stateful-icon stateful-spinner"
          aria-hidden="true"
        />
        <span
          className="stateful-icon stateful-check"
          aria-hidden="true"
        >
          ✓
        </span>
        <span data-stateful-label aria-live="polite">
          {idleLabel}
        </span>
      </button>
      <script dangerouslySetInnerHTML={{ __html: statefulButtonScript }} />
    </div>
  );
}

const statefulButtonScript = `
(() => {
  const button = document.querySelector('[data-stateful-question]');
  if (!button || button.dataset.ready === 'true') return;
  button.dataset.ready = 'true';
  const label = button.querySelector('[data-stateful-label]');
  let timer;

  const reset = () => {
    clearTimeout(timer);
    button.disabled = false;
    button.dataset.state = 'idle';
    button.setAttribute('aria-busy', 'false');
    if (label) label.textContent = button.dataset.idleLabel;
  };

  button.addEventListener('click', () => {
    if (button.disabled) return;
    button.disabled = true;
    button.dataset.state = 'loading';
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = button.dataset.loadingLabel;

    timer = window.setTimeout(() => {
      button.dataset.state = 'success';
      button.setAttribute('aria-busy', 'false');
      if (label) label.textContent = button.dataset.successLabel;
      timer = window.setTimeout(
        () => window.location.assign(button.dataset.href),
        450,
      );
    }, 700);
  });

  window.addEventListener('pageshow', reset);
})();
`;
