import type { Messages } from "@/lib/i18n";
import { Icon } from "./icons";
import { StatefulQuestionButton } from "./stateful-question-button";

export function Faq({
  messages,
  questionUrl,
}: {
  messages: Messages["faq"];
  questionUrl: string;
}) {
  return (
    <section
      className="faq section-shell"
      id="pyetje"
      aria-labelledby="faq-title"
    >
      <div className="faq-heading">
        <p className="section-kicker">{messages.kicker}</p>
        <h2 id="faq-title">{messages.title}</h2>
        <StatefulQuestionButton
          prompt={messages.actionPrompt}
          idleLabel={messages.actionIdle}
          loadingLabel={messages.actionLoading}
          successLabel={messages.actionSuccess}
          href={questionUrl}
        />
      </div>
      <div className="accordion">
        {messages.items.map(({ question, answer }, index) => {
          const panelId = `faq-panel-${index}`;
          return (
            <div className="faq-item" key={question}>
              <h3>
                <button
                  type="button"
                  aria-expanded="false"
                  aria-controls={panelId}
                  data-faq-trigger
                >
                  <span>{question}</span>
                  <Icon name="chevron" size={20} />
                </button>
              </h3>
              <div className="faq-panel" id={panelId} hidden>
                <p>{answer}</p>
              </div>
            </div>
          );
        })}
      </div>
      <script dangerouslySetInnerHTML={{ __html: faqScript }} />
    </section>
  );
}

const faqScript = `
(() => {
  document.querySelectorAll('[data-faq-trigger]').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  });
})();
`;
