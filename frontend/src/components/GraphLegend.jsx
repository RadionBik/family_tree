import React from 'react';
import { useTranslation } from 'react-i18next';

const LegendItem = ({ color, shape, label }) => {
  const shapeStyle = {
    width: '20px',
    height: '20px',
    backgroundColor: color,
    display: 'inline-block',
    marginRight: '8px',
    verticalAlign: 'middle',
    borderRadius: shape === 'ellipse' ? '50%' : (shape === 'rectangle' ? '0' : '4px'), // Adjust based on shapes used
  };
  return (
    <div style={{ marginBottom: '5px' }}>
      <span style={shapeStyle}></span>
      <span>{label}</span>
    </div>
  );
};

const EdgeLegendItem = ({ lineStyle, arrow, label }) => {
    const lineExampleStyle = {
        width: '30px',
        height: '2px',
        borderTop: `2px ${lineStyle} #ccc`,
        display: 'inline-block',
        marginRight: '8px',
        verticalAlign: 'middle',
        position: 'relative',
    };
    const arrowStyle = {
        content: '""',
        position: 'absolute',
        right: '-4px',
        top: '-4px',
        border: 'solid #ccc',
        borderWidth: '0 2px 2px 0',
        display: 'inline-block',
        padding: '3px',
        transform: 'rotate(-45deg)',
    };
    return (
        <div style={{ marginBottom: '5px' }}>
        <span style={lineExampleStyle}>
            {arrow && <span style={arrowStyle}></span>}
        </span>
        <span>{label}</span>
        </div>
    );
};


const GraphLegend = () => {
  const { t } = useTranslation();

  return (
    <div className="graph-legend" style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
      <h4>{t('familyTree.legendTitle')}</h4>
      <LegendItem color="#6CBEEB" shape="rectangle" label={t('gender.male', 'Male')} />
      <LegendItem color="#F7A6C4" shape="ellipse" label={t('gender.female', 'Female')} />
      <LegendItem color="#aaa" shape="round-rectangle" label={t('gender.unknown', 'Unknown/Other')} />
      <hr style={{ margin: '10px 0' }} />
      <EdgeLegendItem lineStyle="solid" arrow={true} label={t('relationType.parent-child', 'Parent-Child')} />
      <EdgeLegendItem lineStyle="dashed" arrow={false} label={t('relationType.spouse', 'Spouse')} />
      {/* Add more items if other relation types are used */}
    </div>
  );
};

export default GraphLegend;