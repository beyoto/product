import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { BASENAME, errorText } from '../site.js';
import { useSite } from '../SiteContext.jsx';
import { formatPrice, categoryLabel } from '../catalog.js';
import SeoFields from '../components/SeoFields.jsx';
import './ProductForm.css';

const MAX_IMAGES = 10;
const UPLOAD_BATCH = 5;

const emptyForm = (type) => ({
  name: '',
  description: '',
  price: '',
  category: type.categories[0].value,
  attributes: {},
  seo: { title: '', description: '' },
});

// Значения особых полей в форме хранятся строками (input), на отправке приводятся к типам.
function toFormAttributes(type, attributes = {}) {
  return Object.fromEntries(type.fields
    .filter((field) => attributes[field.key] !== undefined)
    .map((field) => [field.key, field.type === 'number' ? String(attributes[field.key]) : attributes[field.key]]));
}

function toPayloadAttributes(type, attributes) {
  const result = {};
  for (const field of type.fields) {
    const value = attributes[field.key];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    result[field.key] = field.type === 'number' ? Number(value) : value;
  }
  return result;
}

function AttributeField({ field, value, onChange }) {
  const label = (
    <span>
      {field.label}
      {field.unit && `, ${field.unit}`}
      {field.required && <b> *</b>}
    </span>
  );

  if (field.type === 'multiselect') {
    const selected = value || [];
    const toggle = (option) => onChange(selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option]);

    return (
      <fieldset className="add-product__field--full add-product__chips">
        <legend>{label}</legend>
        <div>
          {field.options.map((option) => (
            <label key={option.value} className={selected.includes(option.value) ? 'is-checked' : ''}>
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="add-product__field">
      {label}
      {field.type === 'select' ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.required}>
          <option value="">{field.required ? 'Выберите' : 'Не указано'}</option>
          {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          maxLength={field.type === 'text' ? 200 : undefined}
          min={field.type === 'number' ? field.min ?? 0 : undefined}
          max={field.type === 'number' ? field.max : undefined}
          step={field.type === 'number' ? field.step ?? (field.integer ? 1 : 'any') : undefined}
        />
      )}
    </label>
  );
}

function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { name: siteName, info, type } = useSite();

  const [form, setForm] = useState(() => emptyForm(type));
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;
    let active = true;

    api.get(`/admin/products/${id}`)
      .then((res) => {
        if (!active) return;
        const product = res.data;
        setForm({
          name: product.name,
          description: product.description || '',
          price: String(Number(product.price)),
          category: product.category,
          attributes: toFormAttributes(type, product.attributes),
          seo: { title: product.seo?.title || '', description: product.seo?.description || '' },
        });
        setExistingImages(product.images);
      })
      .catch((err) => {
        if (active) setError(errorText(err, 'Не удалось загрузить товар'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit, type]);

  // Превью новых фото — object URL, освобождаем при удалении файла и при уходе со страницы.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => () => filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), []);

  const setField = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const setAttribute = (key, value) => setForm((prev) => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));

  const freeSlots = MAX_IMAGES - existingImages.length - files.length;

  const addFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, Math.max(freeSlots, 0));
    setFiles((prev) => [...prev, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };

  const removeFile = (item) => {
    URL.revokeObjectURL(item.preview);
    setFiles((prev) => prev.filter((other) => other !== item));
  };

  const removeExistingImage = async (image) => {
    if (!window.confirm('Удалить это фото?')) return;
    try {
      await api.delete(`/products/${id}/images/${image.id}`);
      setExistingImages((prev) => prev.filter((item) => item.id !== image.id));
    } catch (err) {
      setError(errorText(err, 'Не удалось удалить фото'));
    }
  };

  const uploadImages = async (productId) => {
    for (let i = 0; i < files.length; i += UPLOAD_BATCH) {
      const formData = new FormData();
      files.slice(i, i + UPLOAD_BATCH).forEach((item) => formData.append('images', item.file));
      await api.post(`/products/${productId}/images`, formData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price === '' ? '' : Number(form.price),
      category: form.category,
      attributes: toPayloadAttributes(type, form.attributes),
      seo: form.seo,
    };

    let productId = id;
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        const res = await api.post('/products', payload);
        productId = res.data.id;
      }
    } catch (err) {
      setError(errorText(err, 'Не удалось сохранить товар'));
      setSubmitting(false);
      return;
    }

    try {
      await uploadImages(productId);
      navigate('/admin');
    } catch (err) {
      setError(`Товар сохранён, но фото не загрузились: ${errorText(err, 'ошибка загрузки')}`);
      setFiles([]);
      setSubmitting(false);
      if (!isEdit) navigate(`/admin/edit/${productId}`, { replace: true });
    }
  };

  if (loading) return <div className="add-product"><p className="page-status">Загрузка товара...</p></div>;

  return (
    <div className="add-product">
      <div className="add-product__header">
        <div>
          <h1 className="add-product__title">{isEdit ? 'Редактировать товар' : 'Добавить товар'}</h1>
          <p className="add-product__subtitle">{type.label}: поля карточки подобраны под тип магазина</p>
        </div>
        <button type="button" className="add-product__back" onClick={() => navigate('/admin')}>← Назад</button>
      </div>

      <form className="add-product__form" onSubmit={handleSubmit}>
        <section className="add-product__section">
          <div className="add-product__section-header">
            <div>
              <h2>Основная информация</h2>
              <p>Название, описание, цена и категория</p>
            </div>
          </div>

          <div className="add-product__fields">
            <label className="add-product__field add-product__field--full">
              <span>Название <b>*</b></span>
              <input type="text" name="name" value={form.name} onChange={setField} maxLength={255} required />
            </label>

            <label className="add-product__field add-product__field--full">
              <span>Описание</span>
              <textarea name="description" value={form.description} onChange={setField} rows="5" maxLength={5000} />
            </label>

            <label className="add-product__field">
              <span>Цена <b>*</b></span>
              <div className="add-product__input-with-suffix">
                <input type="number" name="price" value={form.price} onChange={setField} placeholder="0 — цена по запросу" min="0" step="0.01" required />
                <span>{info.currency}</span>
              </div>
            </label>

            <label className="add-product__field">
              <span>Категория</span>
              <select name="category" value={form.category} onChange={setField}>
                {type.categories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </section>

        {type.fields.length > 0 && (
          <section className="add-product__section">
            <div className="add-product__section-header">
              <div>
                <h2>Характеристики</h2>
                <p>Заполни то, что известно. Пустые поля на сайте не показываются</p>
              </div>
            </div>

            <div className="add-product__fields">
              {type.fields.map((field) => (
                <AttributeField
                  key={field.key}
                  field={field}
                  value={form.attributes[field.key]}
                  onChange={(value) => setAttribute(field.key, value)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="add-product__section">
          <div className="add-product__section-header">
            <div>
              <h2>Фотографии</h2>
              <p>До {MAX_IMAGES} фото на товар. Первое фото — обложка</p>
            </div>
            <span className="add-product__counter">{existingImages.length + files.length} / {MAX_IMAGES}</span>
          </div>

          {existingImages.length > 0 && (
            <div className="add-product__gallery">
              {existingImages.map((image, index) => (
                <figure key={image.id}>
                  <img src={image.url} alt={`Фото ${index + 1}`} />
                  <button type="button" onClick={() => removeExistingImage(image)} aria-label={`Удалить фото ${index + 1}`}>×</button>
                </figure>
              ))}
            </div>
          )}

          {freeSlots > 0 && (
            <label className="add-product__upload">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} />
              <div className="add-product__upload-icon">+</div>
              <strong>Добавить фотографии</strong>
              <span>JPEG, PNG или WEBP · до 5 МБ на файл</span>
            </label>
          )}

          {files.length > 0 && (
            <div className="add-product__files">
              {files.map((item) => (
                <div className="add-product__file" key={item.preview}>
                  <div className="add-product__file-info">
                    <div className="add-product__file-icon"><img src={item.preview} alt={item.file.name} /></div>
                    <div>
                      <strong>{item.file.name}</strong>
                      <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile(item)} aria-label={`Убрать ${item.file.name}`}>×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="add-product__section">
          <div className="add-product__section-header">
            <div>
              <h2>SEO и превью ссылки</h2>
              <p>Необязательно. Пусто — возьмём название, описание и первое фото</p>
            </div>
          </div>
          <SeoFields
            title={form.seo.title}
            description={form.seo.description}
            onChange={(seo) => setForm((prev) => ({ ...prev, seo }))}
            fallback={{
              title: `${form.name || 'Название товара'} — ${siteName}`,
              description: form.description
                || [categoryLabel(type, form.category), formatPrice(form.price, info.currency), siteName].join(' · '),
            }}
            url={`${window.location.origin}${BASENAME}/product/${id || '…'}`}
            image={existingImages[0]?.url || files[0]?.preview}
          />
        </section>

        {error && <div className="add-product__error" role="alert">{error}</div>}

        <div className="add-product__actions">
          <button type="button" className="add-product__cancel" onClick={() => navigate('/admin')} disabled={submitting}>
            Отмена
          </button>
          <button type="submit" className="add-product__submit" disabled={submitting}>
            {submitting ? 'Сохраняем...' : isEdit ? 'Сохранить' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
