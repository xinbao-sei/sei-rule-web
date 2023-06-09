const WRAPPER_CLASS_NAME = 'node-wrapper';
const WRAPPER_STROKE = 'rgba(0, 0, 0, 0.1)';

const nameText = text => {
  if (text.length <= 12) {
    return { rowCount: 1, nameTitle: text };
  }
  const row1 = text.substr(0, 12);
  const row2 = text.substr(12, text.length);
  return {
    rowCount: 2,
    nameTitle: `${row1}\r\n${row2.length > 12 ? `${row2.substr(0, 12)}...` : row2}`,
  };
};

export default G6 => {
  G6.registerNode(
    'mind-node',
    {
      draw(cfg, group) {
        const { name = '', rank, collapsed, parentId, trueNode, finished } = cfg;
        const { rowCount, nameTitle } = nameText(name);
        const rectConfig = {
          width: 202,
          height: 60,
          lineWidth: 1,
          fontSize: 14,
          fill: '#fff',
          radius: 4,
          stroke: WRAPPER_STROKE,
          opacity: 1,
          cursor: 'pointer',
          modelId: cfg.id,
        };

        const nodeOrigin = {
          x: -rectConfig.width / 2,
          y: -rectConfig.height / 2,
        };

        const textConfig = {
          textAlign: 'left',
          textBaseline: 'bottom',
        };

        const rect = group.addShape('rect', {
          className: WRAPPER_CLASS_NAME,
          draggable: true,
          attrs: {
            x: nodeOrigin.x,
            y: nodeOrigin.y,
            ...rectConfig,
          },
        });

        const rectBBox = rect.getBBox();

        // label title
        group.addShape('text', {
          attrs: {
            ...textConfig,
            x: 12 + nodeOrigin.x,
            y: rowCount === 1 ? 26 + nodeOrigin.y : 32 + nodeOrigin.y,
            text: nameTitle,
            fontSize: 12,
            opacity: 0.85,
            fill: '#000',
          },
          draggable: true,
          name: 'name-shape',
        });

        // 是否结束节点
        const finish = group.addShape('text', {
          attrs: {
            ...textConfig,
            x: 12 + nodeOrigin.x,
            y: rectBBox.maxY - 12,
            text: finished ? '结束' : '',
            fontSize: 10,
            fontWeight: 700,
            fill: '#f5222d',
            opacity: 1,
          },
          draggable: true,
        });

        // 是否为真节点
        const xtn = finished ? 8 : 0;
        group.addShape('text', {
          attrs: {
            ...textConfig,
            x: finish.getBBox().maxX + xtn,
            y: rectBBox.maxY - 12,
            text: trueNode ? '为真' : '',
            fontSize: 10,
            fontWeight: 700,
            fill: '#0ba679',
            opacity: 1,
          },
          draggable: true,
        });

        // priority
        group.addShape('text', {
          attrs: {
            ...textConfig,
            x: -18 + nodeOrigin.x,
            y: rectBBox.maxY - 40,
            text: parentId ? rank : '',
            fontSize: 14,
            fill: '#722ed1',
            opacity: 0.85,
          },
        });

        // collapse rect
        if (cfg.children && cfg.children.length) {
          group.addShape('rect', {
            attrs: {
              x: rectConfig.width / 2 - 8,
              y: -8,
              radius: 8,
              width: 16,
              height: 16,
              lineWidth: 1,
              stroke: collapsed ? '#91d5ff' : 'rgba(0, 0, 0, 0.25)',
              cursor: 'pointer',
              fill: '#fff',
            },
            name: 'collapse-back',
            modelId: cfg.id,
          });

          // collpase text
          group.addShape('text', {
            attrs: {
              x: rectConfig.width / 2,
              y: -0.5,
              fontSize: 16,
              textAlign: 'center',
              textBaseline: 'middle',
              text: collapsed ? cfg.children.length : '-',
              cursor: 'pointer',
              fill: collapsed ? '#2db7f5' : 'rgba(0, 0, 0, 0.45)',
            },
            name: 'collapse-text',
            modelId: cfg.id,
          });
        }

        this.drawLinkPoints(cfg, group);
        return rect;
      },
      update(cfg, item) {
        const group = item.getContainer();
        this.updateLinkPoints(cfg, group);
      },
      setState(name, value, item) {
        const group = item.getContainer();
        const states = item.getStates();
        const nodeData = item.getModel();
        if (name === 'collapse') {
          const collapseBack = group.find(e => e.get('name') === 'collapse-back');
          const collapseText = group.find(e => e.get('name') === 'collapse-text');
          if (collapseBack) {
            if (!value) {
              collapseBack.attr({
                fill: '#fff',
                stroke: 'rgba(0, 0, 0, 0.25)',
              });
            } else {
              collapseBack.attr({
                fill: '#e6f7ff',
                stroke: '#91d5ff',
              });
            }
          }
          if (collapseText) {
            if (!value) {
              collapseText.attr({
                text: '-',
                fontSize: 18,
                fill: 'rgba(0, 0, 0, 0.45)',
              });
            } else {
              collapseText.attr({
                fill: '#2db7f5',
                fontSize: 14,
                text: nodeData.children.length,
              });
            }
          }
        }
        if (name === 'dragEnter') {
          const wrapperShape = group.findByClassName(WRAPPER_CLASS_NAME);
          const collapseBack = group.find(e => e.get('name') === 'collapse-back');
          if (value) {
            wrapperShape.attr({
              stroke: '#52c41a',
              shadowBlur: 30,
              shadowColor: '#3e9a11',
            });
            if (collapseBack) {
              collapseBack.attr({
                stroke: '#52c41a',
                shadowBlur: 10,
                shadowColor: '#3e9a11',
              });
            }
          } else {
            wrapperShape.attr({
              stroke: WRAPPER_STROKE,
              shadowBlur: 0,
            });
            if (collapseBack) {
              collapseBack.attr({
                fill: '#fff',
                stroke: 'rgba(0, 0, 0, 0.25)',
                shadowBlur: 0,
              });
            }
          }
        }
        if (name === 'active' && states.indexOf('selected') === -1) {
          const wrapperShape = group.findByClassName(WRAPPER_CLASS_NAME);
          if (value) {
            wrapperShape.attr({
              stroke: '#91d5ff',
            });
          } else {
            wrapperShape.attr({
              stroke: WRAPPER_STROKE,
              shadowBlur: 0,
            });
          }
        }
        if (name === 'selected') {
          const wrapperShape = group.findByClassName(WRAPPER_CLASS_NAME);
          if (value) {
            wrapperShape.attr({
              stroke: '#1890ff',
              shadowBlur: 10,
              shadowColor: 'rgb(95, 149, 255)',
            });
          } else {
            wrapperShape.attr({
              stroke: WRAPPER_STROKE,
              shadowBlur: 0,
            });
          }
        }
      },
      getAnchorPoints() {
        return [
          [0, 0.5],
          [1, 0.5],
        ];
      },
    },
    'rect',
  );
};
