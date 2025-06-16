import { describe, it, expect } from 'vitest';
import Button from './button';

describe('Button Component', () => {
	it('renders correctly', () => {
		const button = new Button();
		expect(button).toBeTruthy();
	});

	it('has the correct label', () => {
		const button = new Button('Click Me');
		expect(button.label).toBe('Click Me');
	});

	it('triggers click event', () => {
		const button = new Button();
		let clicked = false;
		button.onClick = () => { clicked = true; };
		button.click();
		expect(clicked).toBe(true);
	});
});