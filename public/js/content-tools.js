// Inside - 게시물/댓글 작성 보조 스크립트 (점진적 향상).
// 이 파일이 없어도 글쓰기/댓글 작성 자체는 순수 HTML 폼 제출로 동작한다.
// 여기서는 두 가지만 담당한다:
//   1) textarea에 이미지를 붙여넣으면(Ctrl+V) 자동 업로드 후 커서 위치에 삽입
//   2) textarea에서 "%{"를 입력하면 이모티콘 자동완성 팝업을 커서 위에 표시
// CSP(trusted-types 'none')로 인해 innerHTML 등은 쓸 수 없어 DOM API로만 구성한다.
(function () {
  'use strict';

  var UPLOAD_URL = '/api/images';
  var MAX_SUGGESTIONS = 8;

  function getCsrfToken(formEl) {
    var field = formEl && formEl.querySelector('input[name="csrf_token"]');
    return field ? field.value : '';
  }

  function uploadFile(file, csrfToken) {
    return fetch(UPLOAD_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrfToken },
      body: file,
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!res.ok) {
            throw new Error((data && data.error) || '업로드에 실패했습니다 (' + res.status + ')');
          }
          return data.url;
        });
    });
  }

  function readEmoticons(sourceId) {
    var el = sourceId && document.getElementById(sourceId);
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  // ---- 이미지 붙여넣기 업로드 ----

  function formatFor(textarea) {
    var form = textarea.closest('form');
    if (!form) return 'plain';
    var checked = form.querySelector('input[name="content_format"]:checked');
    return checked ? checked.value : 'plain';
  }

  function imageMarkupFor(format, url) {
    if (format === 'markdown') return '![image](' + url + ')';
    if (format === 'html') return '<img src="' + url + '" alt="image">';
    return url;
  }

  function replaceRange(textarea, start, end, text) {
    textarea.focus();
    textarea.setSelectionRange(start, end);
    textarea.setRangeText(text, start, end, 'end');
  }

  function handlePaste(event, textarea) {
    var items = (event.clipboardData && event.clipboardData.items) || [];
    var imageItem = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image/') === 0) {
        imageItem = items[i];
        break;
      }
    }
    if (!imageItem) return;

    var file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();

    var form = textarea.closest('form');
    var csrfToken = getCsrfToken(form);
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var placeholder = '[이미지 업로드 중...]';
    replaceRange(textarea, start, end, placeholder);
    var placeholderEnd = start + placeholder.length;

    uploadFile(file, csrfToken)
      .then(function (url) {
        var markup = imageMarkupFor(formatFor(textarea), url);
        replaceRange(textarea, start, placeholderEnd, markup);
      })
      .catch(function (err) {
        replaceRange(textarea, start, placeholderEnd, '');
        window.alert('이미지 업로드에 실패했습니다: ' + (err && err.message ? err.message : '알 수 없는 오류'));
      });
  }

  // ---- %{이름}% 이모티콘 자동완성 ----

  function getCaretCoordinates(el, position) {
    var mirror = document.createElement('div');
    var style = window.getComputedStyle(el);
    var props = [
      'boxSizing', 'width', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent', 'whiteSpace',
      'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    ];
    props.forEach(function (p) {
      mirror.style[p] = style[p];
    });
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.top = '0';
    mirror.style.left = '-9999px';
    mirror.style.height = 'auto';

    var value = el.value;
    mirror.textContent = value.slice(0, position);
    var span = document.createElement('span');
    span.textContent = value.slice(position) || '.';
    mirror.appendChild(span);
    document.body.appendChild(mirror);

    var elRect = el.getBoundingClientRect();
    var mirrorRect = mirror.getBoundingClientRect();
    var spanRect = span.getBoundingClientRect();
    var top = elRect.top + (spanRect.top - mirrorRect.top) - el.scrollTop;
    var left = elRect.left + (spanRect.left - mirrorRect.left) - el.scrollLeft;
    document.body.removeChild(mirror);
    return { top: top, left: left };
  }

  function EmoticonPopup(textarea, allEmoticons) {
    this.textarea = textarea;
    this.all = allEmoticons;
    this.el = null;
    this.items = [];
    this.activeIndex = 0;
    this.triggerStart = -1;
    this.cursorPos = -1;
  }

  EmoticonPopup.prototype.close = function () {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
    this.items = [];
    this.triggerStart = -1;
  };

  EmoticonPopup.prototype.isOpen = function () {
    return this.el !== null;
  };

  EmoticonPopup.prototype.updateFromCaret = function () {
    var pos = this.textarea.selectionStart;
    if (pos !== this.textarea.selectionEnd) {
      this.close();
      return;
    }
    var uptoCursor = this.textarea.value.slice(0, pos);
    var match = /%\{([a-zA-Z0-9_-]{0,20})$/.exec(uptoCursor);
    if (!match) {
      this.close();
      return;
    }
    var query = match[1].toLowerCase();
    var candidates = this.all
      .filter(function (e) {
        return e.name.toLowerCase().indexOf(query) === 0;
      })
      .slice(0, MAX_SUGGESTIONS);

    if (candidates.length === 0) {
      this.close();
      return;
    }

    this.triggerStart = pos - match[0].length;
    this.cursorPos = pos;
    this.items = candidates;
    this.activeIndex = 0;
    this.render();
  };

  EmoticonPopup.prototype.render = function () {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);

    var popup = document.createElement('div');
    popup.setAttribute('role', 'listbox');
    popup.className =
      'fixed z-50 max-h-56 w-56 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 py-1 text-sm shadow-lg';

    var self = this;
    this.items.forEach(function (item, index) {
      var option = document.createElement('button');
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.className =
        'flex w-full items-center gap-2 px-2 py-1.5 text-left text-zinc-200 hover:bg-zinc-800' +
        (index === self.activeIndex ? ' bg-zinc-800' : '');

      var img = document.createElement('img');
      img.src = item.url;
      img.alt = '';
      img.width = 18;
      img.height = 18;
      img.className = 'h-[18px] w-[18px] shrink-0 object-contain';

      var label = document.createElement('span');
      label.textContent = item.name;
      label.className = 'truncate';

      option.appendChild(img);
      option.appendChild(label);

      // click 대신 mousedown + preventDefault: textarea가 blur되기 전에 선택을 확정한다.
      option.addEventListener('mousedown', function (event) {
        event.preventDefault();
        self.select(index);
      });

      popup.appendChild(option);
    });

    document.body.appendChild(popup);
    this.el = popup;

    var coords = getCaretCoordinates(this.textarea, this.cursorPos);
    var top = coords.top - popup.offsetHeight - 6;
    if (top < 4) top = coords.top + 20;
    var left = Math.min(coords.left, window.innerWidth - popup.offsetWidth - 8);
    popup.style.top = Math.max(4, top) + 'px';
    popup.style.left = Math.max(4, left) + 'px';
  };

  EmoticonPopup.prototype.move = function (delta) {
    if (!this.isOpen()) return;
    this.activeIndex = (this.activeIndex + delta + this.items.length) % this.items.length;
    this.render();
  };

  EmoticonPopup.prototype.select = function (index) {
    var item = this.items[index];
    if (!item) return;
    var text = '%{' + item.name + '}%';
    replaceRange(this.textarea, this.triggerStart, this.cursorPos, text);
    this.close();
  };

  function setupContentTextarea(textarea) {
    var sourceId = textarea.getAttribute('data-emoticon-source');
    var emoticons = readEmoticons(sourceId);
    var popup = new EmoticonPopup(textarea, emoticons);

    textarea.addEventListener('paste', function (event) {
      handlePaste(event, textarea);
    });

    if (emoticons.length > 0) {
      textarea.addEventListener('input', function () {
        popup.updateFromCaret();
      });
      textarea.addEventListener('click', function () {
        popup.updateFromCaret();
      });
      textarea.addEventListener('blur', function () {
        popup.close();
      });
      textarea.addEventListener('keydown', function (event) {
        if (!popup.isOpen()) return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          popup.move(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          popup.move(-1);
        } else if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          popup.select(popup.activeIndex);
        } else if (event.key === 'Escape') {
          popup.close();
        }
      });
    }
  }

  // ---- 파일 선택 업로드 (예: /emotion 페이지) ----

  function setupImageUploadInput(input) {
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;

      var targetId = input.getAttribute('data-image-upload-target');
      var target = targetId ? document.getElementById(targetId) : null;
      var previewId = input.getAttribute('data-image-upload-preview');
      var preview = previewId ? document.getElementById(previewId) : null;
      var statusId = input.getAttribute('data-image-upload-status');
      var status = statusId ? document.getElementById(statusId) : null;
      var form = input.closest('form');
      var submitButton = form ? form.querySelector('button[type="submit"]') : null;
      var csrfToken = getCsrfToken(form);

      if (status) status.textContent = '업로드 중...';
      input.disabled = true;
      if (submitButton) submitButton.disabled = true;

      uploadFile(file, csrfToken)
        .then(function (url) {
          if (target) target.value = url;
          if (preview) {
            preview.src = url;
            preview.classList.remove('hidden');
          }
          if (status) status.textContent = '업로드 완료';
        })
        .catch(function (err) {
          if (status) status.textContent = '업로드 실패: ' + (err && err.message ? err.message : '알 수 없는 오류');
        })
        .then(function () {
          input.disabled = false;
          if (submitButton) submitButton.disabled = false;
        });
    });
  }

  document.querySelectorAll('[data-content-tools]').forEach(setupContentTextarea);
  document.querySelectorAll('[data-image-upload]').forEach(setupImageUploadInput);
})();
