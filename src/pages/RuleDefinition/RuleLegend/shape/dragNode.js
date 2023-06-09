const nodeDelegationStyle = {
  stroke: '#1890FF',
  fill: '#ffffff',
  fillOpacity: 0.8,
  lineDash: [4, 4],
  radius: 4,
  lineWidth: 2,
  shadowBlur: 30,
  shadowColor: '#1890FF',
  cursor: 'move',
};

export default function(G6, moveConfirm) {
  G6.registerBehavior('dragNode', {
    getDefaultCfg() {
      return {
        updateEdge: true,
        delegate: true,
        delegateStyle: {},
        align: true,
      };
    },
    getEvents() {
      return {
        'node:dragstart': 'onDragStart',
        'node:drag': 'onDrag',
        'node:dragenter': 'onDragEnter',
        'node:dragleave': 'onDragLeave',
        'node:dragend': 'onDragEnd',
        'node:drop': 'onDrop',
      };
    },
    onDragStart(e) {
      if (!this.shouldBegin.call(this, e)) {
        return;
      }
      const { item } = e;
      this.target = item;
      this.origin = {
        x: e.x,
        y: e.y,
        allowLink: null,
      };
    },
    onDrag(e) {
      if (!this.origin) {
        return;
      }
      if (!this.get('shouldUpdate').call(this, e)) {
        return;
      }
      const { origin } = this;
      const groupId = this.target.get('groupId');
      const model = this.target.get('model');
      if (!this.point) {
        this.point = {
          x: model.x,
          y: model.y,
        };
      }
      if (groupId) {
        const subProcessNode = this.graph.findById(groupId);
        const subProcessBBox = subProcessNode.getBBox();
        const x = e.x - origin.x + this.point.x + subProcessBBox.x + subProcessBBox.width / 2;
        const y = e.y - origin.y + this.point.y + subProcessBBox.y + subProcessBBox.height / 2;
        this.origin = { x: e.x, y: e.y };
        this.point = {
          x: x - subProcessBBox.x - subProcessBBox.width / 2,
          y: y - subProcessBBox.y - subProcessBBox.height / 2,
        };
        if (this.delegate) {
          this._updateDelegate(this.target, x, y);
        }
      } else {
        const x = e.x - origin.x + this.point.x;
        const y = e.y - origin.y + this.point.y;
        Object.assign(this.origin, { x: e.x, y: e.y });
        // this.origin = { x: e.x, y: e.y };
        this.point = { x, y };
        if (this.delegate) {
          this._updateDelegate(this.target, x, y);
        }
      }
    },
    getCurrentNodeAllParentIds(id) {
      const treeData = [this.graph.get('data')];
      const temp = [];
      const forFn = (arr, tempId) => {
        for (let i = 0; i < arr.length; i += 1) {
          const item = arr[i];
          if (item.id === tempId) {
            temp.push(item.id);
            forFn(treeData, item.parentId);
            break;
          } else if (item.children && item.children.length > 0) {
            forFn(item.children, tempId);
          }
        }
      };
      forFn(treeData, id);
      return temp;
    },
    onDragEnter(e) {
      const { item } = e;
      const enterModel = item.getModel();
      const targetModel = this.target.getModel();
      const endterParentIds = this.getCurrentNodeAllParentIds(enterModel.id);
      if (enterModel.id !== targetModel.id) {
        if (
          enterModel.id !== targetModel.parentId &&
          !enterModel.finished &&
          endterParentIds.indexOf(targetModel.id) === -1
        ) {
          this.graph.setItemState(item, 'dragEnter', true);
          this.origin.allowLink = true;
        } else {
          this.origin.allowLink = false;
          this.graph.setItemState(item, 'dragEnter', false);
        }
      }
    },
    onDragLeave(e) {
      const { item } = e;
      this.origin.allowLink = null;
      this.graph.setItemState(item, 'dragEnter', false);
    },
    onDrop(e) {
      const { item } = e;
      const enterModel = item.getModel();
      const targetModel = this.target.getModel();
      const endterParentIds = this.getCurrentNodeAllParentIds(enterModel.id);
      if (
        enterModel.id !== targetModel.parentId &&
        enterModel.id !== targetModel.id &&
        !enterModel.finished &&
        !enterModel.finished &&
        endterParentIds.indexOf(targetModel.id) === -1
      ) {
        moveConfirm(targetModel, enterModel);
      }
      this.origin.allowLink = null;
      this.graph.setItemState(item, 'dragEnter', false);
    },
    onDragEnd(e) {
      if (!this.shouldEnd.call(this, e)) {
        return;
      }
      if (!this.origin) {
        return;
      }
      const delegateShape = e.item.get('delegateShape');
      const delegateShapeLabel = e.item.get('delegateShapeLabel');
      const shapeStatus = e.item.get('delegateShapeStatus');
      const statusWrap = e.item.get('delegateShapeStatusWrap');
      const groupId = this.target.get('groupId');
      if (groupId) {
        if (delegateShape) {
          // const subProcessNode = this.graph.findById(groupId);
          // const subProcessBBox = subProcessNode.getBBox();
          // const bbox = delegateShape.getBBox();
          // const x = bbox.x + bbox.width / 2 - subProcessBBox.x - subProcessBBox.width / 2;
          // const y = bbox.y + bbox.height / 2 - subProcessBBox.y - subProcessBBox.height / 2;
          delegateShape.remove();
          delegateShapeLabel.remove();
          shapeStatus.remove();
          statusWrap.remove();
          this.target.set('delegateShape', null);
          this.target.set('delegateShapeLabel', null);
          this.target.set('delegateShapeStatus', null);
          this.target.set('delegateShapeStatusWrap', null);
          // const group = subProcessNode.getContainer();
          // const id = this.target.get('id');
          // const resultModel = group.updateNodeModel(subProcessNode, id, { x, y });
          // this._updateItem(subProcessNode, resultModel);
        }
      } else if (delegateShape) {
        // const bbox = delegateShape.getBBox();
        // const x = bbox.x + bbox.width / 2;
        // const y = bbox.y + bbox.height / 2;
        delegateShape.remove();
        delegateShapeLabel.remove();
        shapeStatus.remove();
        statusWrap.remove();
        this.target.set('delegateShape', null);
        this.target.set('delegateShapeLabel', null);
        this.target.set('delegateShapeStatus', null);
        this.target.set('delegateShapeStatusWrap', null);
        // this._updateItem(this.target, { x, y });
      }
      this.point = null;
      this.origin = null;
      this.graph.emit('afternodedragend');
    },
    _updateItem(item, point) {
      if (this.graph.executeCommand) {
        this.graph.executeCommand('update', {
          itemId: item.get('id'),
          updateModel: point,
        });
      } else if (this.get('updateEdge')) {
        this.graph.updateItem(item, point);
      } else {
        item.updatePosition(point);
        // this.graph.paint();
      }
    },
    _updateDelegate(item, x, y) {
      const self = this;
      const { name } = item.getModel();
      let shapeLabel = item.get('delegateShapeLabel');
      let shapeStatus = item.get('delegateShapeStatus');
      let shape = item.get('delegateShape');
      let statusWrap = item.get('delegateShapeStatusWrap');
      const bbox = item.get('keyShape').getBBox();
      let shapeAttr = { ...nodeDelegationStyle };
      let labelAttr = { fill: '#1890FF' };
      let statusAttr = { text: '' };
      let statusWrapAttr = { opacity: 0 };
      if (this.origin.allowLink === true) {
        shapeAttr = {
          stroke: '#0ba679',
          fill: '#f6ffed',
          shadowColor: '#0ba679',
        };
        labelAttr = { fill: '#0ba679' };
        statusAttr = {
          fill: '#0ba679',
          text: '✓',
          x: -6 + x - bbox.width / 2,
        };
        statusWrapAttr = {
          stroke: '#0ba679',
          fill: '#f6ffed',
          opacity: 1,
          shadowColor: '#0ba679',
        };
      }
      if (this.origin.allowLink === false) {
        labelAttr = { fill: '#f5222d' };
        shapeAttr = {
          stroke: '#f5222d',
          fill: '#fff1f0',
          shadowColor: '#f5222d',
        };
        statusAttr = {
          fill: '#f5222d',
          text: '✖',
        };
        statusWrapAttr = {
          stroke: '#f5222d',
          fill: '#fff1f0',
          opacity: 1,
          shadowColor: '#f5222d',
        };
      }
      if (!shape) {
        const parent = self.graph.get('group');
        const attrs = nodeDelegationStyle;
        // model上的x, y是相对于图形中心的，delegateShape是g实例，x,y是绝对坐标
        shape = parent.addShape('rect', {
          attrs: {
            width: bbox.width,
            height: bbox.height,
            x: x - bbox.width / 2,
            y: y - bbox.height / 2,
            nodeId: item.get('id'),
            name: 'drag-ghost-shape',
            cursor: 'move',
            ...attrs,
          },
        });
        shapeLabel = parent.addShape('text', {
          attrs: {
            width: bbox.width,
            height: bbox.height,
            x: 12 + x - bbox.width / 2,
            y: 37 + y - bbox.height / 2,
            text: name.length > 20 ? `${name.substr(0, 20)}...` : name,
            fontSize: 14,
            opacity: 1,
          },
          name: 'drag-name-shape',
        });
        statusWrap = parent.addShape('rect', {
          attrs: {
            x: -8 + x - bbox.width / 2,
            y: 22 + y - bbox.height / 2,
            radius: 8,
            width: 16,
            height: 16,
            lineWidth: 1,
            shadowBlur: 10,
          },
          name: 'status-wrap',
        });
        shapeStatus = parent.addShape('text', {
          attrs: {
            x: -5 + x - bbox.width / 2,
            y: 37 + y - bbox.height / 2,
            fontSize: 14,
            fontWeight: 700,
            name: 'drag-status-shape',
            opacity: 1,
            text: '',
          },
        });
        statusWrap.set('capture', false);
        shapeStatus.set('capture', false);
        shapeLabel.set('capture', false);
        shape.set('capture', false);
        item.set('delegateShapeStatusWrap', statusWrap);
        item.set('delegateShapeLabel', shapeLabel);
        item.set('delegateShapeStatus', shapeStatus);
        item.set('delegateShape', shape);
      }
      shape.attr({ x: x - bbox.width / 2, y: y - bbox.height / 2, ...shapeAttr });
      shapeLabel.attr({ x: 12 + x - bbox.width / 2, y: 37 + y - bbox.height / 2, ...labelAttr });
      shapeStatus.attr({ x: -5 + x - bbox.width / 2, y: 37 + y - bbox.height / 2, ...statusAttr });
      statusWrap.attr({
        x: -8 + x - bbox.width / 2,
        y: 22 + y - bbox.height / 2,
        ...statusWrapAttr,
      });
      this.graph.paint();
      this.graph.emit('afternodedrag', shape);
    },
  });
}
