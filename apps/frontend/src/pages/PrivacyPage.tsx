import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '10 червня 2026 р.';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 font-body">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/65 backdrop-blur-2xl border-b border-white/40 h-12 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 glass-icon"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-base font-bold text-neutral-900">Політика конфіденційності</h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        <p className="text-sm text-neutral-400">Останнє оновлення: {LAST_UPDATED}</p>

        {/* Intro */}
        <section className="space-y-3">
          <p className="text-neutral-700 leading-relaxed">
            Ця Політика конфіденційності описує, як платформа <strong>&amp;u</strong> («ми», «нас», «наш») збирає,
            використовує та захищає вашу особисту інформацію, коли ви користуєтеся нашим застосунком
            і пов'язаними сервісами.
          </p>
          <p className="text-neutral-700 leading-relaxed">
            Використовуючи &amp;u, ви погоджуєтеся з умовами цієї Політики. Якщо ви не згодні,
            будь ласка, припиніть використання платформи.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 1 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">1. Яку інформацію ми збираємо</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">Дані, які ви надаєте</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                <li>Ім'я, прізвище та псевдонім (username)</li>
                <li>Email-адреса та номер телефону</li>
                <li>Фото профілю та обкладинка</li>
                <li>Дата народження та стать</li>
                <li>Місто, біографія, захоплення</li>
                <li>Посилання на соціальні мережі (Instagram, Telegram, WhatsApp, Facebook, Threads)</li>
                <li>Повідомлення в чатах і коментарі</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">Дані, що збираються автоматично</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                <li>IP-адреса та інформація про пристрій (тип браузера, ОС)</li>
                <li>Час і дата сеансів, дії в застосунку</li>
                <li>Куки та схожі технології сеансу</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">Дані від третіх сторін</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                <li>Ім'я та email із Google, Apple або Facebook, якщо ви входите через OAuth</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-neutral-100" />

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">2. Як ми використовуємо ваші дані</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
            <li>Забезпечення роботи акаунту, аутентифікація та захист від зловживань</li>
            <li>Відображення вашого профілю та контактів іншим користувачам відповідно до ваших налаштувань приватності</li>
            <li>Надсилання повідомлень, сповіщень та запрошень у межах платформи</li>
            <li>Покращення функціональності та виправлення помилок</li>
            <li>Формування зведеної аналітики (без ідентифікації особи) для розвитку сервісу</li>
            <li>Виконання вимог чинного законодавства</li>
          </ul>
          <p className="text-sm text-neutral-500 bg-neutral-100 rounded-xl px-4 py-3">
            Ми <strong>не продаємо</strong> ваші персональні дані третім особам і не використовуємо
            їх для таргетованої реклами.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">3. Зберігання та захист даних</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ваші дані зберігаються на захищених серверах. Паролі хешуються з використанням bcrypt;
            зображення профілю зберігаються у вигляді зашифрованих рядків безпосередньо в базі даних.
            Ми застосовуємо HTTPS для усього трафіку та JWT-токени для аутентифікації.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ми зберігаємо ваші дані, поки ваш акаунт активний. Після видалення акаунту дані видаляються
            протягом 30 днів, якщо інше не передбачено законодавством.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">4. Налаштування приватності</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ви самостійно керуєте видимістю кожного поля профілю — email, телефон, соцмережі можна
            приховати або показати лише контактам. За замовчуванням усі контактні дані приховані.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Налаштування приватності доступні в розділі <strong>Налаштування → Профіль</strong>.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">5. Куки та локальне сховище</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ми використовуємо HTTP-куки для зберігання refresh-токена сеансу (HttpOnly, Secure, SameSite=Strict).
            У localStorage зберігається мінімальна інформація для швидкого завантаження інтерфейсу
            (мова, ідентифікатор користувача без конфіденційних полів).
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">6. Треті сторони</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
            <li><strong>Google OAuth</strong> — необов'язково, для входу через Google-акаунт</li>
            <li><strong>Apple Sign-In</strong> — необов'язково, для входу через Apple ID</li>
            <li><strong>Facebook Login</strong> — необов'язково, для входу через Facebook</li>
            <li><strong>Google Gemini API</strong> — для генерації чек-листів та резюме подій; запити не містять персональних даних</li>
          </ul>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Кожен із цих сервісів має власну політику конфіденційності. Ми не передаємо їм вашу
            особисту інформацію поза межами, необхідними для аутентифікації.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">7. Ваші права</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Відповідно до Загального регламенту про захист даних (GDPR) та чинного законодавства України
            ви маєте право:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
            <li><strong>Доступу</strong> — отримати копію своїх персональних даних</li>
            <li><strong>Виправлення</strong> — оновити або виправити неточні дані в налаштуваннях профілю</li>
            <li><strong>Видалення</strong> — запросити видалення акаунту та всіх пов'язаних даних</li>
            <li><strong>Обмеження обробки</strong> — тимчасово зупинити обробку ваших даних</li>
            <li><strong>Переносимості</strong> — отримати свої дані у машиночитаному форматі</li>
            <li><strong>Відкликання згоди</strong> — відкликати будь-яку раніше надану згоду</li>
          </ul>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Для реалізації будь-якого з цих прав зверніться до нас за адресою нижче.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">8. Діти</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Платформа &amp;u не призначена для осіб молодше 13 років. Ми свідомо не збираємо
            персональні дані дітей. Якщо вам відомо, що дитина надала нам свої дані,
            будь ласка, зв'яжіться з нами для їх видалення.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">9. Зміни до цієї Політики</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ми можемо оновлювати цю Політику час від часу. Про суттєві зміни ми повідомимо
            через сповіщення в застосунку або email. Продовжуючи використовувати &amp;u після
            набрання змін чинності, ви приймаєте оновлену Політику.
          </p>
        </section>

        <hr className="border-neutral-100" />

        {/* 10 */}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-neutral-900">10. Контакти</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Якщо у вас є питання або запити щодо цієї Політики, будь ласка, зв'яжіться з нами:
          </p>
          <div className="bg-neutral-100 rounded-xl px-4 py-3 text-sm text-neutral-700 space-y-1">
            <p><strong>&amp;u</strong></p>
            <p>Email: <a href="mailto:privacy@andyou.app" className="text-accent-600 hover:underline">privacy@andyou.app</a></p>
          </div>
        </section>

        <div className="pt-4 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} &amp;u. Всі права захищено.
        </div>
      </div>
    </div>
  );
}
