const fontSizePlugin = (function () {
  const PREFIX = "toastui-editor-";

  const createToolbarItemOption = (content) => {
    return {
      name: "font-size",
      tooltip: "Font Size",
      className: `${PREFIX}toolbar-icons font-size`,
      popup: {
        className: `${PREFIX}popup-font-size`,
        body: content,
        style: { width: "auto" },
      },
    };
  };

  const createSelection = (
    tr,
    selection,
    SelectionClass,
    openTag,
    closeTag
  ) => {
    const { mapping, doc } = tr;
    const { from, to, empty } = selection;
    const mappedFrom = mapping.map(from) + openTag.length;
    const mappedTo = mapping.mpa(to) + closeTag.length;

    return empty
      ? SelectionClass.create(doc, mappedTo, mappedTo)
      : SelectionClass.create(doc, mappedFrom, mappedTo);
  };

  let currentEditorEl;

  const fontSizePlugin = (context, options = {}) => {
    const { eventEmitter, usageStatistics = true, pmState } = context;
    const { preset } = options;
    const content = document.createElement("div");
    const fontSizePickerOption = { content, usageStatistics };
    const fontSizeValues = [
      5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
    ];

    content.classList.add("font-size-picker");

    fontSizeValues.forEach((s) => {
      const btn = document.createElement("button");
      btn.setAttribute("type", "button");
      btn.textContent = s;
      content.appendChild(btn);
    });

    if (preset) fontSizePickerOption.preset = preset;

    eventEmitter.listen("focus", (editType) => {
      const containerClassName = `${PREFIX}${
        editType === "markdown" ? "md" : "ww"
      }-container`;

      currentEditorEl = document.querySelector(
        `.${containerClassName} .ProseMirror`
      );
    });

    content.addEventListener("click", (e) => {
      let selectedFontSize = e.target.textContent;

      eventEmitter.emit("command", "fontSize", { selectedFontSize });
      eventEmitter.emit("closePopup");
      currentEditorEl.focus();
    });

    const toolbarItem = createToolbarItemOption(content);

    return {
      markdownCommands: {
        fontSize: (
          { selectedFontSize },
          { tr, selection, schema },
          dispatch
        ) => {
          if (selectedFontSize) {
            const slice = selection.content();
            const textContent = slice.content.textBetween(
              0,
              slice.content.size,
              "\n"
            );
            const openTag = `<span style="font-size: ${selectedFontSize}px">`;
            const closeTag = "</span>";
            const sized = `${openTag}${textContent}${closeTag}`;

            tr.replaceSelectionWith(schema.text(sized)).setSelection(
              createSelection(
                tr,
                selection,
                pmState.TextSelection,
                openTag,
                closeTag
              )
            );

            dispatch(tr);

            return true;
          }

          return false;
        },
      },
      wysiwygCommands: {
        fontSize: (
          { selectedFontSize },
          { tr, selection, schema },
          dispatch
        ) => {
          if (selectedFontSize) {
            const { from, to } = selection;
            const attrs = {
              htmlAttrs: { style: `font-size: ${selectedFontSize}px` },
            };
            const mark = schema.marks.span.create(attrs);

            tr.addMark(from, to, mark);
            dispatch(tr);

            return true;
          }

          return false;
        },
      },
      toolbarItems: [
        {
          groupIndex: 0,
          itemIndex: 3,
          item: toolbarItem,
        },
      ],
      toHTMLRenderers: {
        htmlInline: {
          span(node, { entering }) {
            return entering
              ? {
                  type: "openTag",
                  tagName: "span",
                  attributes: node.attrs,
                }
              : { type: "closeTag", tagName: "span" };
          },
        },
      },
    };
  };

  return fontSizePlugin;
})();
