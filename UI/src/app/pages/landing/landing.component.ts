import { ModalService } from '../../shared/services/modal.service';
import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface Testimonial {
  title: string;
  text: string;
  author: string;
  company: string;
  avatar: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements AfterViewInit {
  @ViewChildren('testimonialCard') testimonialCards!: QueryList<ElementRef>;
  trackingId: string = '';

  testimonials: Testimonial[] = [
    {
      title: 'Fantastic service!',
      text: 'I purchased a phone from an e-commerce site, and this courier service provider assisted me in getting it delivered to my home. I received my phone within one day, and I was really satisfied with their service when I received it.',
      author: 'Yves Tanguy',
      company: 'Chief Executive, DLF',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
    {
      title: 'Great service provider!',
      text: 'Great service provider assisted me in getting it and I was really satisfied with the service where I came with the system after shipping from rural area. I was impressed.',
      author: 'Yea Teslave',
      company: 'Chief Executive. CO',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    },
    {
      title: 'Quick and dependable!',
      text: 'I purchased a phone from an e-commerce site, and this courier service provider assisted me in getting it delivered on time. That service was quick and dependable.',
      author: 'John Smith',
      company: 'Marketing Manager',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    },
  ];

  private observer!: IntersectionObserver;

  constructor(public modalService: ModalService,     private router: Router ) {}

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    this.testimonialCards.forEach((card) => {
      this.observer.observe(card.nativeElement);
    });
  }

    trackParcel() {
    const trimmed = this.trackingId.trim();
    if (trimmed) {
      this.router.navigate(['/parcel', trimmed]);
    }
  }
}
