import './SeoFields.css';

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 200;
const TITLE_GOOD = 60;
const DESCRIPTION_GOOD = 160;

const clip = (text, max) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

function Counter({ value, good, max }) {
  const length = value.length;
  const state = length > good ? 'seo-fields__count--long' : '';
  return <span className={`seo-fields__count ${state}`}>{length} / {good}{length > good ? ` (макс. ${max})` : ''}</span>;
}

// Поля SEO и превью: как страница выглядит в Google и в мессенджерах.
// fallback — то, что подставится автоматически, если поле пустое (так же считает shops/seo/render.js).
function SeoFields({ title, description, onChange, fallback, url, image }) {
  const shownTitle = title || fallback.title;
  const shownDescription = clip(description || fallback.description, DESCRIPTION_GOOD);
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <div className="seo-fields">
      <label className="add-product__field add-product__field--full">
        <span>
          SEO-заголовок <Counter value={title} good={TITLE_GOOD} max={SEO_TITLE_MAX} />
        </span>
        <input
          type="text"
          value={title}
          maxLength={SEO_TITLE_MAX}
          placeholder={fallback.title}
          onChange={(e) => onChange({ title: e.target.value, description })}
        />
      </label>

      <label className="add-product__field add-product__field--full">
        <span>
          SEO-описание <Counter value={description} good={DESCRIPTION_GOOD} max={SEO_DESCRIPTION_MAX} />
        </span>
        <textarea
          rows="3"
          value={description}
          maxLength={SEO_DESCRIPTION_MAX}
          placeholder={fallback.description}
          onChange={(e) => onChange({ title, description: e.target.value })}
        />
      </label>

      <div className="seo-fields__previews">
        <div className="seo-preview seo-preview--google" aria-label="Как в Google">
          <span className="seo-preview__label">Google</span>
          <span className="seo-preview__url">{url}</span>
          <strong className="seo-preview__title">{clip(shownTitle, TITLE_GOOD)}</strong>
          <p>{shownDescription}</p>
        </div>

        <div className="seo-preview seo-preview--share" aria-label="Как в WhatsApp и Telegram">
          <span className="seo-preview__label">WhatsApp / Telegram</span>
          <div className="seo-preview__card">
            {image ? <img src={image} alt="" /> : <div className="seo-preview__no-image">Нет фото</div>}
            <div>
              <strong>{clip(shownTitle, 80)}</strong>
              <p>{clip(description || fallback.description, 110)}</p>
              <span>{domain}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeoFields;
