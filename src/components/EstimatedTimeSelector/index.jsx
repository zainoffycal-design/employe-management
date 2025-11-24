import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiClock } from 'react-icons/fi';
import './EstimatedTimeSelector.scss';

const ESTIMATE_TEMPLATES = {
  'Website': {
    'Home Page': 8,
    'Internal Page': 4,
    'Responsive Version': {
      'Home page': 8,
      'Internal page': 3
    },
    'Feedback': null
  },
  'Mobile App': {
    'Home Page': 4,
    'On Boarding': 4,
    'Internal Pages': 3
  },
  'Web Application': {
    'OnBoarding': 4,
    'Dashboard': 8,
    'Internal Pages': 4
  },
  'Design System': {
    'Basic': 5,
    'Intermediate': 16,
    'Advanced': 40
  }
};

const EstimatedTimeSelector = ({ value, onChange, disabled = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedNestedCategory, setSelectedNestedCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customSubCategoryName, setCustomSubCategoryName] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [numberOfPages, setNumberOfPages] = useState('');
  const [layout, setLayout] = useState('100');
  const skipNextEffectRef = useRef(false);

  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }

    if (!value) {
      if (selectedCategory === 'custom') return;
      setSelectedCategory('');
      setSelectedSubCategory('');
      setSelectedNestedCategory('');
      setCustomCategoryName('');
      setCustomSubCategoryName('');
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      return;
    }

    if (typeof value === 'object' && value.category) {
      const category = value.category || '';
      const subCategory = value.subCategory || '';
      const hours = value.hours;
      const pages = value.numberOfPages;
      const layoutValue = value.layout;

      if (category && !ESTIMATE_TEMPLATES[category]) {
        setCustomCategoryName(category);
        setSelectedCategory('custom');
        setSelectedSubCategory('');
        setCustomSubCategoryName(subCategory || '');
        setSelectedNestedCategory(value.nestedCategory || '');
        setCustomHours(hours != null ? hours.toString() : '');
        setNumberOfPages(pages != null ? pages.toString() : '');
        setLayout(layoutValue || '100');
      } else if (category) {
        setSelectedCategory(category);
        setCustomCategoryName('');
        setSelectedSubCategory(subCategory);

        if (subCategory && category) {
          const categoryData = ESTIMATE_TEMPLATES[category];
          if (categoryData && !categoryData[subCategory]) {
            setCustomSubCategoryName(subCategory);
          } else {
            setCustomSubCategoryName('');
          }
        } else {
          setCustomSubCategoryName('');
        }

        setSelectedNestedCategory(value.nestedCategory || '');
        setCustomHours(hours != null ? hours.toString() : '');
        setNumberOfPages(pages != null ? pages.toString() : '');
        setLayout(layoutValue || '100');
      }
    } else if (typeof value === 'number' || (typeof value === 'string' && value.trim())) {
      const hoursValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(hoursValue)) {
        setCustomHours(hoursValue.toString());
        setSelectedCategory('custom');
        setSelectedSubCategory('custom');
        setNumberOfPages('');
        setLayout('100');
      }
    }
  }, [value, selectedCategory]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    skipNextEffectRef.current = true;
    
    if (category === 'custom') {
      setSelectedCategory('custom');
      setSelectedSubCategory('');
      setSelectedNestedCategory('');
      setCustomCategoryName('');
      setCustomSubCategoryName('');
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue('', '', '', '', '', '100');
    } else {
      setSelectedCategory(category);
      setSelectedSubCategory('');
      setSelectedNestedCategory('');
      setCustomCategoryName('');
      setCustomSubCategoryName('');
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(category, '', '', '', '', '100');
    }
  };

  const handleCustomCategoryNameChange = (name) => {
    skipNextEffectRef.current = true;
    setCustomCategoryName(name);
    if (!name || name.trim() === '') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue('', '', '', '', '', '100');
    } else {
      updateValue(name, customSubCategoryName, selectedNestedCategory, customHours, numberOfPages, layout);
    }
  };

  const handleSubCategoryChange = (e) => {
    const subCategory = e.target.value;
    skipNextEffectRef.current = true;
    setSelectedSubCategory(subCategory);
    setSelectedNestedCategory('');
    setCustomSubCategoryName('');

    const actualCategory = selectedCategory === 'custom' ? customCategoryName : selectedCategory;

    if (!subCategory || subCategory === '') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, '', '', '', '', '100');
      return;
    }

    const categoryData = ESTIMATE_TEMPLATES[actualCategory];
    if (!categoryData) {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, subCategory, '', '', '', '100');
      return;
    }

    const subCategoryData = categoryData[subCategory];

    if (typeof subCategoryData === 'object') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, subCategory, '', '', '', '100');
    } else {
      const hours = subCategoryData;
      const isInternalPage = subCategory.toLowerCase().includes('internal page');
      if (isInternalPage) {
        setCustomHours('');
        setNumberOfPages('');
        setLayout('100');
        updateValue(actualCategory, subCategory, '', '', '', '100');
      } else {
        setCustomHours(hours ? hours.toString() : '');
        setNumberOfPages('');
        setLayout('100');
        updateValue(actualCategory, subCategory, '', hours ? hours.toString() : '', '', '100');
      }
    }
  };

  const handleCustomSubCategoryNameChange = (name) => {
    skipNextEffectRef.current = true;
    setCustomSubCategoryName(name);
    const actualCategory = selectedCategory === 'custom' ? customCategoryName : selectedCategory;
    if (!name || name.trim() === '') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, '', selectedNestedCategory, '', '', '100');
    } else {
      const isInternalPage = name.toLowerCase().includes('internal page');
      if (isInternalPage) {
        setCustomHours('');
        setNumberOfPages('');
        setLayout('100');
        updateValue(actualCategory, name, selectedNestedCategory, '', '', '100');
      } else {
        updateValue(actualCategory, name, selectedNestedCategory, customHours, numberOfPages, layout);
      }
    }
  };

  const handleNestedCategoryChange = (e) => {
    const nestedCategory = e.target.value;
    skipNextEffectRef.current = true;
    setSelectedNestedCategory(nestedCategory);

    const actualCategory = selectedCategory === 'custom' ? customCategoryName : selectedCategory;
    const actualSubCategory = selectedSubCategory === 'custom' ? customSubCategoryName : selectedSubCategory;

    if (!nestedCategory || nestedCategory === '') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, actualSubCategory, '', '', '', '100');
      return;
    }

    const categoryData = ESTIMATE_TEMPLATES[actualCategory];
    if (!categoryData) {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, actualSubCategory, nestedCategory, '', '', '100');
      return;
    }

    const subCategoryData = categoryData[actualSubCategory];
    if (typeof subCategoryData !== 'object') {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, actualSubCategory, nestedCategory, '', '', '100');
      return;
    }

    const hours = subCategoryData[nestedCategory];
    const isInternalPage = nestedCategory.toLowerCase().includes('internal page');
    if (isInternalPage) {
      setCustomHours('');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, actualSubCategory, nestedCategory, '', '', '100');
    } else {
      setCustomHours(hours ? hours.toString() : '');
      setNumberOfPages('');
      setLayout('100');
      updateValue(actualCategory, actualSubCategory, nestedCategory, hours ? hours.toString() : '', '', '100');
    }
  };

  const handleCustomHoursChange = (hours) => {
    skipNextEffectRef.current = true;
    setCustomHours(hours);
    const actualCategory = selectedCategory === 'custom' ? customCategoryName : selectedCategory;
    const actualSubCategory = selectedSubCategory === 'custom' ? customSubCategoryName : selectedSubCategory;
    if (!hours || hours.trim() === '') {
      updateValue(actualCategory, actualSubCategory, selectedNestedCategory, '', numberOfPages, layout);
    } else {
      updateValue(actualCategory, actualSubCategory, selectedNestedCategory, hours, numberOfPages, layout);
    }
  };

  const handleNumberOfPagesChange = (pages) => {
    skipNextEffectRef.current = true;
    setNumberOfPages(pages);
    const actualCategory = selectedCategory === 'custom' ? customCategoryName : selectedCategory;
    const actualSubCategory = selectedSubCategory === 'custom' ? customSubCategoryName : selectedSubCategory;

    if (!pages || pages.trim() === '' || parseFloat(pages) <= 0) {
      setCustomHours('');
      updateValue(actualCategory, actualSubCategory, selectedNestedCategory, '', '', '100');
      return;
    }

    const baseHours = getBaseHoursForInternalPage(actualCategory, actualSubCategory, selectedNestedCategory);
    if (baseHours) {
      const calculatedHours = baseHours * parseFloat(pages);
      setCustomHours(calculatedHours.toString());
      updateValue(actualCategory, actualSubCategory, selectedNestedCategory, calculatedHours.toString(), pages, '100');
    } else {
      updateValue(actualCategory, actualSubCategory, selectedNestedCategory, customHours, pages, '100');
    }
  };

  const getBaseHoursForInternalPage = (category, subCategory, nestedCategory) => {
    if (!category) return null;

    const categoryData = ESTIMATE_TEMPLATES[category];
    if (!categoryData) return null;

    if (nestedCategory) {
      const subCategoryData = categoryData[subCategory];
      if (typeof subCategoryData === 'object' && subCategoryData[nestedCategory]) {
        return subCategoryData[nestedCategory];
      }
    } else {
      const subCategoryData = categoryData[subCategory];
      if (typeof subCategoryData === 'number') {
        return subCategoryData;
      }
    }

    return null;
  };

  const updateValue = (category, subCategory, nestedCategory, hours, pages, layoutValue) => {
    if (onChange) {
      const hoursNum = hours ? parseFloat(hours) : null;
      const pagesNum = pages ? parseFloat(pages) : null;
      onChange({
        category,
        subCategory,
        nestedCategory,
        hours: hoursNum,
        numberOfPages: pagesNum,
        layout: layoutValue || '100',
        displayText: getDisplayText(category, subCategory, nestedCategory)
      });
    }
  };

  const getDisplayText = (category, subCategory, nestedCategory) => {
    if (!category) return '';
    if (!subCategory) return category;
    if (nestedCategory) {
      return `${category} > ${subCategory} > ${nestedCategory}`;
    }
    return `${category} > ${subCategory}`;
  };

  const getSubCategoryOptions = () => {
    if (!selectedCategory || selectedCategory === 'custom') return [];
    return Object.keys(ESTIMATE_TEMPLATES[selectedCategory]).map(key => ({
      value: key,
      label: key,
      isNested: typeof ESTIMATE_TEMPLATES[selectedCategory][key] === 'object'
    }));
  };

  const getNestedCategoryOptions = () => {
    if (!selectedCategory || !selectedSubCategory || selectedCategory === 'custom' || selectedSubCategory === 'custom') return [];
    const categoryData = ESTIMATE_TEMPLATES[selectedCategory];
    if (!categoryData) return [];
    const subCategoryData = categoryData[selectedSubCategory];
    if (!subCategoryData || typeof subCategoryData !== 'object' || subCategoryData === null) return [];
    const keys = Object.keys(subCategoryData);
    const uniqueOptions = [];
    const seen = new Set();
    keys.forEach(key => {
      if (!seen.has(key.toLowerCase())) {
        seen.add(key.toLowerCase());
        uniqueOptions.push({
          value: key,
          label: key,
          hours: subCategoryData[key]
        });
      }
    });
    return uniqueOptions;
  };

  const subCategoryOptions = getSubCategoryOptions();
  const nestedCategoryOptions = getNestedCategoryOptions();
  const showNestedSelect = nestedCategoryOptions.length > 0;

  const isInternalPageSelected = useMemo(() => {
    const actualSubCategory = selectedSubCategory === 'custom' ? customSubCategoryName : selectedSubCategory;
    const actualNestedCategory = selectedNestedCategory;
    return actualSubCategory?.toLowerCase().includes('internal page') ||
           actualNestedCategory?.toLowerCase().includes('internal page');
  }, [selectedSubCategory, customSubCategoryName, selectedNestedCategory]);

  const showHoursInput = useMemo(() => {
    if (isInternalPageSelected) {
      return numberOfPages && parseFloat(numberOfPages) > 0;
    }
    return selectedCategory === 'custom'
      ? (customCategoryName && customSubCategoryName)
      : (selectedSubCategory && (showNestedSelect ? selectedNestedCategory : true));
  }, [selectedCategory, customCategoryName, customSubCategoryName, selectedSubCategory, selectedNestedCategory, showNestedSelect, isInternalPageSelected, numberOfPages]);

  return (
    <div className="estimated-time-selector">
      <label className="selector-label">
        <FiClock size={14} />
        <span>Estimated Hours</span>
      </label>

      <div className="selector-content">
        <div className="form-group">
          <select
            className="form-control"
            value={selectedCategory || ''}
            onChange={handleCategoryChange}
            disabled={disabled}
          >
            <option value="">Select Category</option>
            {Object.keys(ESTIMATE_TEMPLATES).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {selectedCategory === 'custom' && (
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={customCategoryName}
              onChange={(e) => !disabled && handleCustomCategoryNameChange(e.target.value)}
              placeholder="Enter custom category name"
              disabled={disabled}
            />
          </div>
        )}

        {selectedCategory && selectedCategory !== 'custom' && subCategoryOptions.length > 0 && (
          <div className="form-group">
            <select
              className="form-control"
              value={selectedSubCategory}
              onChange={handleSubCategoryChange}
              disabled={disabled}
            >
              <option value="">Select Sub-Category</option>
              {subCategoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCategory === 'custom' && customCategoryName && (
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={customSubCategoryName}
              onChange={(e) => !disabled && handleCustomSubCategoryNameChange(e.target.value)}
              placeholder="Enter custom sub-category name"
              disabled={disabled}
            />
          </div>
        )}

        {isInternalPageSelected && (
          <div className="form-group">
            <input
              type="number"
              className="form-control"
              value={numberOfPages}
              onChange={(e) => !disabled && handleNumberOfPagesChange(e.target.value)}
              placeholder="Enter number of pages"
              min="1"
              step="1"
              disabled={disabled}
            />
          </div>
        )}

        {showNestedSelect && (
          <div className="form-group">
            <select
              className="form-control"
              value={selectedNestedCategory}
              onChange={handleNestedCategoryChange}
              disabled={disabled}
            >
              <option value="">Select Option</option>
              {nestedCategoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showHoursInput && (
          <div className="form-group">
            <div className="hours-input-wrapper">
              <input
                type="number"
                className="form-control"
                value={customHours}
                onChange={(e) => !disabled && handleCustomHoursChange(e.target.value)}
                placeholder="Enter hours"
                min="0"
                step="1"
                disabled={disabled}
                style={customHours && parseFloat(customHours) > 0 ? { paddingRight: '60px' } : {}}
              />
              {customHours && parseFloat(customHours) > 0 && (
                <span className="hours-suffix">
                  {parseFloat(customHours) === 1 ? 'hour' : 'hours'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimatedTimeSelector;
