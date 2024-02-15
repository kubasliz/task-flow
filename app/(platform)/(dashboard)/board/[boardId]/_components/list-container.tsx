'use client';

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { updateListOrder } from '@/actions/update-list-order';
import { updateCardOrder } from '@/actions/update-card-order';
import { useAction } from '@/hooks/use-action';
import { ListWithCards } from '@/types';

import { ListForm } from './list-form';
import { ListItem } from './list-item';

interface ListContainerProps {
  data: ListWithCards[];
  boardId: string;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

export const ListContainer = ({ data, boardId }: ListContainerProps) => {
  const [orderData, setOrderData] = useState(data);

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => {
      toast.success('List reordered');
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: () => {
      toast.success('Card reordered');
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  useEffect(() => {
    setOrderData(data);
  }, [data]);

  const onDragEnd = (result: any) => {
    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // User move a list
    if (type === 'list') {
      const items = reorder(orderData, source.index, destination.index).map(
        (item: any, index: number) => ({
          ...item,
          order: index
        })
      );

      setOrderData(items);
      executeUpdateListOrder({ items, boardId });
    }

    //  User move a card
    if (type === 'card') {
      let newOrderData = [...orderData];

      //Source and destination list
      const sourceList = newOrderData.find((list) => list.id === source.droppableId);
      const destList = newOrderData.find((list) => list.id === destination.droppableId);

      if (!sourceList || !destList) {
        return;
      }

      //  Check if cards exist on the sourceList
      if (!sourceList.cards) {
        sourceList.cards = [];
      }

      // Check if cards exist on the destList
      if (!destList.cards) {
        destList.cards = [];
      }

      //  Moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(sourceList.cards, source.index, destination.index);

        reorderedCards.forEach((card, idx) => {
          card.order = idx;
        });

        sourceList.cards = reorderedCards;

        setOrderData(newOrderData);
        executeUpdateCardOrder({
          boardId: boardId,
          items: reorderedCards
        });

        //  User move the card to another list
      } else {
        //  Remove card from the source list
        const [moveCard] = sourceList.cards.splice(source.index, 1);

        // Asign the new listId to moved card
        moveCard.listId = destination.droppableId;

        // Add card to the destination list
        destList.cards.splice(destination.index, 0, moveCard);

        sourceList.cards.forEach((card, idx) => {
          card.order = idx;
        });

        // Update the order for each card in the destination list
        destList.cards.forEach((card, idx) => {
          card.order = idx;
        });

        setOrderData(newOrderData);
        executeUpdateCardOrder({
          boardId: boardId,
          items: destList.cards
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol {...provided.droppableProps} ref={provided.innerRef} className="flex gap-x-3 h-full">
            {orderData.map((list, index) => {
              return <ListItem key={list.id} index={index} data={list} />;
            })}
            {provided.placeholder}
            <ListForm />
            <div className="flex-shrink-0 w-1" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  );
};
