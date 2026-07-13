Вот правило для программиста.

Как делать формы/квизы под HTML On Page Lead Capture

Любая заявка должна в момент финальной отправки иметь внутри видимого блока хотя бы одно контактное поле: телефон или email.

Лучший вариант:

<form data-hop-lead-form>
  <input name="name" type="text" placeholder="Ваше имя">
  <input name="phone" type="tel" placeholder="+7 (___) ___-__-__">
  <input name="contact_method" type="hidden" value="Telegram">

  <button type="submit">Отправить заявку</button>
</form>

Для кастомного квиза без <form> нужно обернуть квиз в корневой блок и пометить финальную кнопку:

<div data-lead-root>
  <input name="name" type="text">
  <input name="phone" type="tel">

  <button type="button" data-hop-lead-submit>
    Получить расчет
  </button>
</div>

Если телефон рисуется не в <input>, а в кастомном dialpad-блоке, обязательно дублировать его в скрытое поле:

<div id="dialpad-display">+7 (999) 123-45-67</div>
<input type="hidden" name="phone" value="+79991234567">

Для вариантов квиза использовать нормальные name/value:

<label>
  <input type="radio" name="contact_method" value="Telegram">
  Telegram
</label>

<label>
  <input type="checkbox" name="services[]" value="Дезинфекция">
  Дезинфекция
</label>

Финальная кнопка должна быть одной из этих:

<button type="submit">...</button>

или

<button type="button" data-hop-lead-submit>...</button>

Если после отправки показывается success-экран, можно дополнительно пометить его:

<div data-lead-success>
  Заявка принята
</div>

Важно

- У полей должны быть name, не только id.
- Телефон лучше хранить в name="phone".
- Email лучше хранить в name="email".
- Имя лучше хранить в name="name".
- Способ связи: name="contact_method".
- Не очищать поля до отправки или до показа success-экрана.
- Не делать финальную кнопку просто ссылкой <a href="#">, лучше button.
- Если форма должна игнорироваться плагином, добавить data-lead-ignore.

Идеальный стандарт для всех новых лендингов

<div data-lead-root>
  <form data-hop-lead-form>
    <input name="name" type="text">
    <input name="phone" type="tel">
    <input name="contact_method" type="hidden" value="Telegram">
    <input name="quiz_service" type="hidden" value="Уборка после трупа">

    <button type="submit">Отправить</button>
  </form>

  <div data-lead-success hidden>
    Заявка принята
  </div>
</div>

Если программист делает так, плагин будет подхватывать заявки максимально надежно.