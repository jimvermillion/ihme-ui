import React, { PropTypes } from 'react';
import { CommonPropTypes, PureComponent } from '../../../utils';

export default class Animation extends PureComponent {
  constructor(props) {
    super(props);
    this.animate: false;
  }

  render() {
    const {
      children
    } = this.props;
    return (
      <div>
        {children}
      </div>
    );
  }
}

Animation.propTypes = {
  className: CommonPropTypes.className,
  style: CommonPropTypes.style,
  children: PropTypes.node,
  group: PropTypes.string,
};

Animation.defaultProps = {
  group: 'default',
};
