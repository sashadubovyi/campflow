import { useTranslation } from 'react-i18next';
import { BackButton, PageHeader } from '../shared/ui';

export function PublicOfferPage() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col font-body">
      <PageHeader
        title={<span className="font-display">{t('profile.menu.publicOffer', 'Публічна оферта')}</span>}
        left={<BackButton />}
      />

      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="glass-card p-5 space-y-4 text-sm text-neutral-700 leading-relaxed">

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">1. Загальні положення</h2>
            <p>
              Ця Публічна оферта (далі — «Договір») є офіційною пропозицією сервісу &amp;u (далі — «Платформа») щодо
              надання послуг будь-якій фізичній особі (далі — «Користувач»), яка здійснює реєстрацію або використовує
              Платформу. Використання Платформи означає повне та беззастережне прийняття умов цього Договору.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">2. Предмет договору</h2>
            <p>
              Платформа надає Користувачу доступ до сервісів для спільного планування подорожей, заходів та заходів
              («кімнати»), комунікації між учасниками, а також пов'язаних допоміжних функцій (голосування, карти,
              ШІ-помічник тощо).
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">3. Умови використання</h2>
            <ul className="space-y-1.5 list-none">
              {[
                'Реєстрація обов\'язкова. Користувач несе відповідальність за достовірність наданих даних.',
                'Забороняється розміщення незаконного, образливого або шкідливого контенту.',
                'Платформа залишає за собою право призупинити або видалити обліковий запис у разі порушення правил.',
                'Мінімальний вік для реєстрації — 16 років.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">4. Конфіденційність</h2>
            <p>
              Платформа обробляє персональні дані відповідно до Політики конфіденційності. Дані не передаються третім
              особам без явної згоди Користувача, за винятком випадків, передбачених чинним законодавством.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">5. Інтелектуальна власність</h2>
            <p>
              Весь контент Платформи (дизайн, логотип, програмний код) є власністю або ліцензованим матеріалом
              Платформи. Користувач зберігає права на власний контент, але надає Платформі невиняткову ліцензію на його
              використання для надання послуг.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">6. Обмеження відповідальності</h2>
            <p>
              Платформа не несе відповідальності за збитки, що виникли внаслідок неможливості використання сервісу,
              помилок у контенті користувачів або дій третіх осіб. Сервіс надається «як є» без будь-яких гарантій.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">7. Зміна умов</h2>
            <p>
              Платформа залишає за собою право змінювати умови цього Договору. Про суттєві зміни Користувачі будуть
              повідомлені через застосунок або електронну пошту не пізніше ніж за 7 днів до набрання ними чинності.
              Продовження використання Платформи після набрання змінами чинності означає їх прийняття.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-bold text-neutral-900 mb-2">8. Контактна інформація</h2>
            <p>
              З питань, що стосуються цього Договору, звертайтесь за адресою:{' '}
              <a href="mailto:support@campflow.app" className="text-accent-600 hover:underline">
                support@campflow.app
              </a>
            </p>
          </section>

          <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
            Редакція від 1 червня 2025 року.
          </p>
        </div>
      </main>
    </div>
  );
}
